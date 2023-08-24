const xlsx = require('node-xlsx')

let corrects_amount = 0
let emp_grafic = {}

window.addEventListener('DOMContentLoaded', ()=>{

    const first_grafic = document.getElementById('first_grafic')
    const check_btn = document.getElementById('check_btn')
    const corrects_add_btn = document.getElementById('corrects_add_btn')
    check_btn.onclick = function(e){
        e.preventDefault()

        check_btn.style.display = 'none'
        corrects_add_btn.style.display = 'none'
        document.getElementById('loader').style.display = 'block'

        
        let grafic = first_grafic.files[0]
        let sheet_grafic;
        try {
            sheet_grafic = xlsx.parse(grafic.path);
        } catch (error) {
            console.log(error)
            die('Ошибка парсинга файла exel (Основной график). Попробуй пересохранить файл или сохранить нужную таблицу в отдельный файл.')
        }
        //const sheet_grafic = xlsx.parse(grafic.path);
        
        let m = document.getElementById('month').value
        //m = (sheet_grafic.length==1) ? 0 : (sheet_grafic.length<=12) ? m : select_uncaught_month(sheet_grafic)
        if(sheet_grafic.length>12) select_uncaught_month(sheet_grafic)
        else {
            m = (sheet_grafic.length==1) ? 0 : m
            run_update_and_tabel(sheet_grafic, m)
        }
        //функция select_uncaught_month получает текущий месяц и запускает дальнейшую обработку
        //а именно получение данных из осн. графика, инд. графиков и обновления осн. графика и сверки с табелем
        
    }

    corrects_add_btn.onclick = function(e){
        e.preventDefault()
        corrects_amount++
        let div = document.createElement('div')
        div.classList.add('corrects_item')
        let label = document.createElement('label')
        let input = document.createElement('input')
        input.setAttribute('id', 'correct'+corrects_amount)
        input.setAttribute('type', 'file')
        input.setAttribute('data-type', 'correct')
        label.innerText = `Индивидуальный  №${corrects_amount}`
        label.append(input)
        div.append(label)
        document.getElementById('corrects').append(div)
        update_delete_btn()
    }

})

function run_update_and_tabel(sheet_grafic, m){
    emp_grafic = get_employee_grafic(sheet_grafic, m)
    get_and_run_update_grafic()
}

function continue_run_update_and_tabel(){
    const tabel_input = document.getElementById('tabel')

    let tabel = tabel_input.files[0]
    let sheet_tabel;
    
    try {
        sheet_tabel = xlsx.parse(tabel.path);
    } catch (error) {
        console.log(error)
        die('Ошибка парсинга файла exel (Табельный). Попробуй пересохранить файл или сохранить нужную таблицу в отдельный файл.')
    }
    const emp_tabel = get_employee_tabel(sheet_tabel)

    run_check(emp_tabel)
}

function run_check(tabel){
    //*********************** */
    //запускает проверку соответствия данных из графика данным их табеля
    let total_err_arr = []//массив табельных с неправильным количеством часов "итого"
    let incorrect_tab = []
    for(let e in emp_grafic){
        //e - табельный номер
        try {
            if(tabel[e].total!=emp_grafic[e].total) total_err_arr.push(e)
        } catch (error) {
            incorrect_tab.push(e)
            //console.log(`Не удалось проверить ${emp_grafic[e].name}, таб.№${e}. Отличаются табельные номера в графике и табеле`)
        }
    }
    if(incorrect_tab.length>0){
        let div_incorrect_total = document.createElement('div')
        let h_incorrect_total = document.createElement('h3')
        h_incorrect_total.innerText = 'Несовпадающие табельные номера'
        div_incorrect_total.append(h_incorrect_total)

        let ul = document.createElement('ol')
        for(let e of incorrect_tab){
            let li = document.createElement('li')
            li.classList.add('red')
            li.innerText = `${emp_grafic[e].name}, таб.№${e} - не проверен. Отличаются табельные номера в графике и табеле`
            ul.append(li)
        }
        div_incorrect_total.append(ul)
        report.append(div_incorrect_total)
    }

    
    let div_total = document.createElement('div')
    let total_h = document.createElement('h3')
    total_h.innerText = 'Проверка "Итого рабочих часов за месяц"'
    div_total.append(total_h)

    if(total_err_arr.length == 0){
        let p = document.createElement('p')
        p.innerText = 'Ошибок не найдено'
        p.classList.add('green')
        div_total.append(p)
    } else{
        let ul = document.createElement('ol')
        for(let i of total_err_arr){
            let li = document.createElement('li')
            li.classList.add('red')
            li.innerText = `${i}, ${emp_grafic[i].name} - не сходится. В табеле: ${tabel[i].total}, В графике: ${emp_grafic[i].total}`
            ul.append(li)
        }
        div_total.append(ul)
    }
    report.append(div_total)

    //*********************** */
    let div_daily = document.createElement('div')
    let daily_h = document.createElement('h3')
    daily_h.innerText = 'Проверка рабочих часов по дням'
    div_daily.append(daily_h)
    
    let daily_err_arr = []
    for(let e in emp_grafic){
        for(let j in emp_grafic[e].days){
            try {
                if(tabel[e].days[j]!=emp_grafic[e].days[j]) daily_err_arr.push({tab: e, day: j})
            } catch (error) {
                //console.log(`Не удалось проверить ${emp_grafic[e].name}, таб.№${e}. Отличаются табельные номера в графике и табеле`)
            }
        }
    }

    if(daily_err_arr.length==0){
        let p = document.createElement('p')
        p.innerText = 'Ошибок не найдено'
        p.classList.add('green')
        div_daily.append(p)
    }else{
        let ul = document.createElement('ol')
        for(let i in daily_err_arr){
            let li = document.createElement('li')
            li.classList.add('red')
            let lt = daily_err_arr[i].tab
            let ld = daily_err_arr[i].day
            let pday = Number(ld)+1
            li.innerHTML = `${lt}, ${emp_grafic[lt].name}, <b>день ${pday}</b> - в табеле: ${tabel[lt].days[ld]}, в графике: ${emp_grafic[lt].days[ld]}`
            ul.append(li)
        }
        div_daily.append(ul)
    }
    report.append(div_daily)

    document.getElementById('loader').innerText = 'Обработка завершена'
    document.getElementById('loader').style.cssText = 'display: block; margin-top: 2em; text-align: center;font-weight: 600;text-transform: uppercase;'
    document.getElementById('loader').setAttribute('id', '_')
}

function get_employee_grafic(shet, m){
    const sheet = shet[m].data

    console.log('грязный график:')
    //console.log(sheet)

    let day_amount = get_day_amount(Number(document.getElementById('month').value))

    let employers = {}
    let row_counter = 10
    while(row_counter<sheet.length){
        let row = sheet[row_counter]

        let fc = Number(row[0])
        
        if(fc>0 && typeof(row[1])=='string'){
            let obj = { name: '', days: [], total: 0 }

            for(let i=0;i<day_amount;i++){
                let val = Number(row[i+3])
                val = (val>0) ? val : 0
                /*
                if(row[2]==131248){
                    console.log(`${i} - ${val}, typeof - ${typeof(val)}`)
                }
                val = (typeof(val)=='number') ? val : 0
                */
                obj.days.push(val)
            }

            let name = row[1].split(" ")
            obj.name = `${name[0]} ${name[1]}`
            obj.name = obj.name.split("\n")[0]
            
            obj.total = row[36]
            employers[row[2]] = obj
        }
        row_counter++
    }
    
    console.log('график:')
    //console.log(employers)
    return employers;
}

function get_employee_tabel(shet){
    const sheet = shet[0].data
    
    let day_row_counter = 10
    let work_columns = []
    while(day_row_counter<sheet.length){
        let row = sheet[day_row_counter]
        if(typeof(row[2])=='string' && row[2].indexOf('номер')>=0) {
            let counter_days = 3 //счетчик для перебора
            let first_string = 0
            while(counter_days!==false){
                if(typeof(sheet[day_row_counter+1][counter_days])=='string') first_string++
                if(typeof(sheet[day_row_counter+1][counter_days])!='string' && typeof(sheet[day_row_counter+1][counter_days])!='undefined') work_columns.push(counter_days)
        
                if(first_string>=2) counter_days=false
                else counter_days++ //счетчик
            }
            break
        }
        day_row_counter++
    }

    const employers = {}
    let counter_row = 0 //с какой строки начинаем перебирать рабоников
    //перебираем строки до тех пор, пока не наткнемся на пустые 1 и 2 столбцы
    let start_coun = 10
    while(start_coun<sheet.length){
        let fc = Number(sheet[start_coun][0])
        //if(typeof(sheet[start_coun][0])=='number' && typeof(sheet[start_coun][1])=='string') {
        if(fc>0 && typeof(sheet[start_coun][1])=='string') {
            counter_row = start_coun
            break
        }
        start_coun++
    }
    
    while(counter_row<sheet.length){
        if(typeof(sheet[counter_row][0])=='number' && typeof(sheet[counter_row][1])=='string'){
            let row = sheet[counter_row]
            let obj = { name: '', days: [], total: 0 }
            
            for(let e in work_columns){
                let rowPlusOne = sheet[counter_row+3][work_columns[e]]
                rowPlusOne = (typeof(rowPlusOne)=='number') ? rowPlusOne : 0
                let day_hours = sheet[counter_row+1][work_columns[e]] + rowPlusOne
                day_hours = (day_hours>0) ? day_hours : 0
                obj.days.push(day_hours)
            }

            let name = row[1].split(" ")
            obj.name = `${name[0]} ${name[1]} ${name[2]}`
            obj.name = obj.name.split("\n")[0]
            obj.total = row[39]
            employers[row[2]] = obj
        }
        counter_row+=4 //увеличиваем счетчик на 4 чтоб перепрыгнуть на следующего работника
    }
    return employers
}

function update_grafic(shet){
    //обновляет данные в emp_grafic на новые данные
    //const sheet = shet[0].data
    const sheet = shet

    let day_amount = 0
    let day_amount_fact = get_day_amount(Number(document.getElementById('month').value))
    let day_row_counter = 10
    let total_col = 0
    while(day_row_counter<sheet.length){
        let row = sheet[day_row_counter]
        if(typeof(row[2])=='string' && row[2].indexOf('номер')>=0) {
            row = sheet[day_row_counter+1]
            for(let e of row){
                if(typeof(e)=='number') day_amount++
            }

            let counter_total_column = 1
            while(counter_total_column < row.length){

                if(typeof(row[counter_total_column])=='string' && row[counter_total_column].indexOf('рабочих часов')>0){
                    total_col = counter_total_column
                    break
                }
                counter_total_column++
            }
            if(total_col<10){
                let newrow = sheet[day_row_counter]
                counter_total_column = 1
                while(counter_total_column < newrow.length){
                    if(typeof(newrow[counter_total_column])=='string' && newrow[counter_total_column].indexOf('рабочих часов')>0){
                        total_col = counter_total_column
                        break
                    }
                    counter_total_column++
                }
            }
            break
        }
        day_row_counter++
    }

    let row_counter = 10
    let employers_edited = {}
    while(row_counter<sheet.length){
        let row = sheet[row_counter]
        let fc = Number(row[0])

        if(fc>0 && typeof(row[1])=='string'){
            //проверка на пустые рабочие дни
            let skip = check_null_columns(row, day_amount_fact)//колонки пустые - true, есть рабочие часы - false 
            if(!skip) {
                let obj = {
                    name: '',
                    days: [],
                    total: 0
                }
                let arr = []
    
                for(let i=0;i<day_amount_fact;i++){
                    /*
                    let val = row[i+3]
                    val = (typeof(val)=='number') ? val : 0
                    arr.push(val)
                    */
                    let val = Number(row[i+3])
                    val = (val>0) ? val : 0
                    arr.push(val)
                }

                let name = row[1].split(" ")
                obj.name = `${name[0]} ${name[1]}`
                obj.name = obj.name.split("\n")[0]
                
                //obj.total = row[day_amount+4]
                obj.total = row[total_col]
                obj.days = arr
                employers_edited[row[2]] = obj

            }
        }

        row_counter++
    }
    try {
        for(let e in employers_edited){
            if(emp_grafic[e].name!=employers_edited[e].name) console.log(`WARNING ${emp_grafic[e].name}!=${employers_edited[e].name}`)
            emp_grafic[e].days = employers_edited[e].days
            emp_grafic[e].total = employers_edited[e].total
        }
    } catch (error) {
        console.log(error)
    }
}

function get_and_run_update_grafic(){
    if(corrects_amount<1) {
        continue_run_update_and_tabel()
        return
    }
    const corrects = document.getElementById('corrects')
    let correctArr = {}
    let counter = 0
    let needSelect = false
    for(let e of corrects.children){
        let input = e.children[0].children[0].files[0]
        let sheet;
        
        try {
            sheet = xlsx.parse(input.path)
        } catch (error) {
            let loc = counter+1
            console.log(error)
            die('Ошибка парсинга файла exel (индивидуальный график №'+loc+'). Попробуй пересохранить файл или сохранить нужную таблицу в отдельный файл.')
        }

        let obj = {
            shet: sheet,
            month: 0
        }
        if(sheet.length>1) needSelect = true
        correctArr[counter] = obj
        counter++
    }
    //запускаем выбор нужных месяцев для индивидуальных графиков
    if(needSelect){
        //создаем окно
        //перебираем свойства объекта и отправляем таблицы на уточнение
        let popup = document.createElement('div')
        popup.setAttribute('id', 'popup')
        let div = document.createElement('div')
        let p = document.createElement('p')
        p.innerHTML = 'Выбери вкладки <b>индивидуальных</b> графиков,<br>которые нужно проверить'
        div.append(p)

        for(let e in correctArr){
            if(correctArr[e].shet.length>1){
                let label = document.createElement('label')
                let nm = Number(e)+1
                label.innerText = `Индивидуальный график №${nm}`
                let select = document.createElement('select')
                select.setAttribute('data-number', e)
                select.setAttribute('class', 'nedUpd')
                select.style.cssText = 'display: block; margin-top:'
                for(let i in correctArr[e].shet){
                    let option = document.createElement('option')
                    option.setAttribute('value', i)
                    option.innerText = correctArr[e].shet[i].name
                    select.append(option)
                }
                label.append(select)
                div.append(label)
            }
        }

        let btn = document.createElement('button')
        btn.setAttribute('id', 'save-update-delete-popup')
        btn.innerText = 'Подтвердить'
        
        div.append(btn)
        popup.append(div)
        document.body.append(popup)

        btn.onclick = () => {
            let cls = document.getElementsByClassName('nedUpd')
            for(let e of cls){
                let a = e.getAttribute('data-number')
                correctArr[a].month = e.value
            }
            document.getElementById('popup').remove()
            //run_update_and_tabel(shet, m)
            
            for(let e in correctArr){
                //if(correctArr[e].shet.length>1)
                //update_grafic(sheet[0].data)
                update_grafic(correctArr[e].shet[correctArr[e].month].data)
            }
            continue_run_update_and_tabel()
        }
    } else {
        for(let e in correctArr){
            //if(correctArr[e].shet.length>1)
            //update_grafic(sheet[0].data)
            update_grafic(correctArr[e].shet[correctArr[e].month].data)
        }
        continue_run_update_and_tabel()
    }
    
}

//получение нужной вкладки ОСНОВНОГО ГРАФИКА, если месяцев (вкладок в файле) больше 12
function select_uncaught_month(shet){
    let popup = document.createElement('div')
    popup.setAttribute('id', 'popup')
    let div = document.createElement('div')
    let p = document.createElement('p')
    p.innerHTML = 'Выбери вкладку <b>основного</b> графика,<br>которую нужно проверить'
    let select = document.createElement('select')
    select.setAttribute('id', 'select-month')
    for(let e in shet) {
        //e - порядковый номер
        //shet[e].name - название вкладки
        let option = document.createElement('option')
        option.setAttribute('value', e)
        option.innerText = shet[e].name
        select.append(option)
    }
    let btn = document.createElement('button')
    btn.setAttribute('id', 'delete-popup')
    btn.innerText = 'Подтвердить'
    
    div.append(p)
    div.append(select)
    div.append(btn)
    popup.append(div)
    document.body.append(popup)

    btn.onclick = () => {
        let m = document.getElementById('select-month').value
        document.getElementById('popup').remove()
        run_update_and_tabel(shet, m)
    }

    //run_update_and_tabel(sheet_grafic, m)
}

//проверка на ненулевую строчку (ячейки в строке)
function check_null_columns(row, day_amount){
    let is_null = true;
    for(let i=0;i<day_amount;i++){
        if(typeof(row[i+3]) =='number') return false
    }
    return is_null
}

//получение кол-ва дней в месяце
function get_day_amount(month){
    switch(month){
        case 0: return 31//янв
        case 1: //фев
            let year = new Date()
            year = year.getFullYear()
            let date1 = new Date(year, 1, 1)
            let date2 = new Date(year, 2, 1)
            return Math.round((date2-date1) / 1000 / 3600 / 24)
        case 2: return 31//март
        case 3: return 30//апр
        case 4: return 31//май
        case 5: return 30//июнь
        case 6: return 31//июль
        case 7: return 31//авг
        case 8: return 30//сен
        case 9: return 31//окт
        case 10: return 30//ноя
        case 11: return 31//дек
    }
}

//перезагрузить страницу=прервать выполнение
function die(message = undefined){
    if (message == undefined ) window.location.reload()
    else if(!alert(message)) window.location.reload()
}