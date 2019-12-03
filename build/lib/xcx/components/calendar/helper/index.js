const Core = require('../../aotoo/core/index')
const lib = Core.lib

function indexData(data=[]) {
  let tmp = {}
  data.forEach((item, ii)=>{
    if (item.date) {
      tmp[item.date] = {index: ii}
    }
  })
  return tmp
}

export function sortDates(params) {
  if (lib.isArray(params)) {
    params = params.filter(item=>{
      if (item.date) {
        item.date = formatDate(item.date)
        return item
      }
    })

    return params.sort((a, b)=>{
      let astamp = newDate(a.date)
      let bstamp = newDate(b.date)
      return astamp - bstamp
    })
  }
}

export function formatDate(date) {
  let ymd = getYmd(date)
  return `${ymd.year}-${ymd.month}-${ymd.day}`
}

// 工具方法 - start
// 1.为了获得每个月的日期有多少，我们需要判断 平年闰年[四年一闰，百年不闰，四百年再闰]
export function isLeapYear(year) {
  return (year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0);
}

let aboutMonth = [
  31, null, 31, 30,
  31, 30, 31, 31,
  30, 31, 30, 31
]
// 2.获得每个月的日期有多少，注意 month - [0-11]
export function getMonthCount(year, month) {
  let arr = [
    31, null, 31, 30,
    31, 30, 31, 31,
    30, 31, 30, 31
  ];
  let count = arr[month] || (isLeapYear(year) ? 29 : 28);
  aboutMonth[1] = arr[1]
  return Array.from(new Array(count), (item, value) => value + 1);
}

// 3.获得某年某月的 1号 是星期几，这里要注意的是 JS 的 API-getDay() 是从 [日-六](0-6)，返回 number
export function getWeekday(year, month) {
  let date = new Date(year, month, 1);
  return date.getDay();
}

// 4.获得上个月的天数
export function getPreMonthCount(year, month) {
  if (month === 0) {
    return getMonthCount(year - 1, 11);
  } else {
    return getMonthCount(year, month - 1);
  }
}

// 5.获得下个月的天数
export function getNextMonthCount(year, month) {
  if (month === 11) {
    return getMonthCount(year + 1, 0);
  } else {
    return getMonthCount(year, month + 1);
  }
}

export function newDate(timepoint){
  if (timepoint) {
    if (timepoint.getDate && timepoint.getFullYear) return timepoint

    if (lib.isNumber(timepoint)) {
      return new Date(timepoint)
    }

    if (lib.isString(timepoint)) {
      timepoint = timepoint.replace(/\-/g, '/')
      timepoint = timepoint.replace(/\:/g, '/')
      return new Date(timepoint)
    }
  } else {
    return new Date()
  }
}

// 获取年月日
// 接受时间 戳或者/2019-10-1/2019:10:1 输入格式
// export function getYmd(year, month, day) {
export function getYmd(timepoint) {
  let nowDate = newDate()
  if (timepoint) nowDate = newDate(timepoint)
  let year = nowDate.getFullYear()
  let month = (nowDate.getMonth()+1)
  let day = nowDate.getDate()
  return {year, month, day}
}

// 这里获得我们第一次的 数据 数组
export function completeMonth(timestart) {
  let globalDisable = this.disable
  let fillupData = this.fillData
  let defaultDate = this.date // 默认日期显示，item类型
  let dataIndexs = indexData(fillupData)
  // 生成日历数据，上个月的 x 天 + 当月的 [28,29,30,31]天 + 下个月的 y 天 = 42
  let res = [];
  let today = getYmd() // 今天
  let todayStamp = newDate(todayDate).getTime()
  let {year, month, day} = getYmd(timestart)
  let todayDate = `${today.year}-${today.month}-${today.day}`
  let currentMonth = getMonthCount(year, month-1);
  let preMonth = getPreMonthCount(year, month-1);
  let nextMonth = getNextMonthCount(year, month-1);
  let whereMonday = getWeekday(year, month-1);
  let preArr = preMonth.slice(-1 * (whereMonday || -(preMonth.length)));
  let patchDay = (42 - currentMonth.length - whereMonday)%7
  let nextArr = nextMonth.slice(0, patchDay);

  let startDayStamp = this.validStartDay
  let endDayStamp = this.validEndDay
  let sDate = getYmd(startDayStamp)
  let startDate = `${sDate.year}-${sDate.month}-${sDate.day}`
  
  preArr = preArr.map(num=>({title: {title: num, itemClass: 'date-item-day'}, itemClass: 'invalid'}) )
  nextArr = nextArr.map(num=>({title: {title: num, itemClass: 'date-item-day'}, itemClass: 'invalid'}))

  currentMonth = currentMonth.map(_num=>{
    let theDate = `${year}-${month}-${_num}`
    let theStamp = newDate(theDate).getTime()
    let num = {title: _num, itemClass: 'date-item-day'}
    if (todayDate === theDate) num.title = '今天'
    if (theStamp <= endDayStamp) {
      let ori = {title: num, timestamp: theStamp, date: theDate, year, month, day: _num, itemClass: 'valid'}
      ori = Object.assign({}, ori, defaultDate)
      let dateTap = `onSelected?type=date&date=${theDate}`
      if (globalDisable === false) {
        ori.tap = dateTap
      }

      // 是否匹配data中的数据
      if (dataIndexs[theDate]) {
        let index = dataIndexs[theDate].index
        let fillData = fillupData[index].content || fillupData[index]
        ori = Object.assign({}, ori, fillData)
        ori.valid = true // 有效日期
        if (theStamp < todayStamp) {
          ori.disable = true
        }
      } else {
        if (globalDisable) ori.disable = true
      }

      // 小于开始日期
      if (theStamp < startDayStamp) {
        ori.disable = true
        // ori.itemClass = 'valid invalid'
        // delete ori.tap
      }

      if (ori.disable) {
        ori.itemClass = 'valid invalid'
        if (fillupData.length) ori.valid = false // 只有data有数据的时候才设置该值
        delete ori.tap
      } else {
        ori.itemClass = 'valid'
        ori.tap = dateTap
      }

      // if (ori.disable === false) {
      //   ori.itemClass = 'valid'
      //   ori.tap = dateTap
      // } else if(ori.disable) {
      //   ori.itemClass = 'valid invalid'
      //   delete ori.tap
      // }

      return ori
    } else {
      return {title: num, itemClass: 'valid invalid'}
    }
  })

  res = [].concat(preArr, currentMonth, nextArr);
  return res
};

export function oneMonthListConfig(timestart) {
  let that = this
  let options = this.options
  let allowBox = this.allowBox
  let checkType = options.type   // single/range/mutiple
  let rangeCount = options.rangeCount
  let rangeMode = options.rangeMode
  let allMonths = this.allMonths
  let {year, month, day} = getYmd(timestart)
  let endPoint = getYmd(this.validEndDay)
  let monthDays = completeMonth.call(this, timestart)
  let originalMonthDays = lib.clone(monthDays)


  function getFollowMonths(first, over) {
    let endMonth = endPoint.month // 最终月
    let firstPoint = first
    let edgePoint = over || {}
    let others = []
    let nexts = []
    let firstStat = false
    let findStat = false
    for (let ii=0; ii<allMonths.length; ii++) {
      let mon = getYmd(allMonths[ii])

      if (mon.year === firstPoint.year && mon.month === firstPoint.month) {
        firstStat = ii
      }
      if ((firstStat || firstStat === 0) && ii>firstStat && (findStat === false)) {
        nexts.push(`${that.calenderId}-${mon.year}-${mon.month}`)
      }

      if (mon.year === edgePoint.year && mon.month === edgePoint.month) {
        findStat = ii
      }
      if ((findStat || findStat===0) && ii > findStat) {
        others.push(`${that.calenderId}-${mon.year}-${mon.month}`)
      }
    }
    return { others, nexts }
  }
  

  // 点击住店日期后，有效期为一个月，隐藏有效期之后的月份
  function periodValidDays(param, period = 30) {
    // {date: "2019-11-14"}
    let curPoint = getYmd(param.date)
    let curDayStamp = newDate(param.date).getTime()
    let endDayStamp = curDayStamp + (period * 24 * 60 * 60 * 1000)
    let edgePoint = getYmd(endDayStamp)
    let edgeMonth = `${edgePoint.year}-${edgePoint.month}`
    let edgeDate = `${edgePoint.year}-${edgePoint.month}-${edgePoint.day}`

    let follow = getFollowMonths(curPoint, edgePoint)
    let others = follow.others
    let nexts = follow.nexts

    // that.calendar.children.forEach(child=>{
    //   child.visible(true)
    //   child.show()
    //   if (child.lazyDisplay) {
    //     child.hooks.emit('emptyChecked', {itemClass: 'invalid'})
    //   }
    // })

    // 隐藏所有需要隐藏的月份
    others.forEach(monInstId => {
      let handle = that.activePage.getElementsById(monInstId)
      if (handle) {
        handle.visible(false)
        handle.hide()
        // let parent = handle.parent()
        // if (parent) {
        //   parent.hide()
        // }
      }
    })

    if (!nexts.length) {
      nexts.push(that.calenderId + '-' + edgeMonth)
    } else {
      nexts.unshift(`${that.calenderId}-${curPoint.year}-${curPoint.month}`)
    }

    let newEdgeDate = null // 自定义边界日期
    let myhandle = null

    if (allowBox.rangeEdge) {
      if (allowBox.rangeEdge && lib.isString(allowBox.rangeEdge)) {
        let ymd = getYmd(allowBox.rangeEdge)
        let newEdgeDateId = that.calenderId + '-' + '-' + ymd.year + '-' + ymd.month
        let handle = that.activePage.getElementsById(newEdgeDateId)
        handle && handle.tint(newEdgeDate, null, 'invalid')
      }
      if (allowBox.rangeEdge && lib.isFunction(allowBox.rangeEdge)) {
        let context = {
          current: curDayStamp,
          end: endDayStamp,
          getYmd,
          calenderId: that.calenderId,
          activePage: that.activePage
        }
        newEdgeDate = allowBox.rangeEdge.call(context, nexts)
        if (newEdgeDate) {
          let ymd = getYmd(newEdgeDate)
          let newEdgeDateId = that.calenderId + '-' + '-' + ymd.year + '-' + ymd.month
          let handle = that.activePage.getElementsById(newEdgeDateId)
          handle && handle.tint(newEdgeDate, null, 'invalid')
        }
      }
    } else {
      nexts.forEach(monInstId => {
        let edgeId = that.calenderId + '-' + edgeMonth
        let handle = that.activePage.getElementsById(monInstId)
        if (handle) {
          if (edgeId === monInstId) {
            // handle.hooks.emit('emptyChecked', {itemClass: 'invalid'})
            handle.tint(edgeDate, null, 'invalid')
          }
        }
      })
    }
  }
  
  return {
    "@list": {
      $$id: `${this.calenderId}-${year}-${month}`,
      header: {
        title: `${year}年${month}月`,
        show: this.allowBox.monthHeader,
        aim: `onSelectedMonth?type=month&date=${year}-${month}`,
        itemClass: 'calendar-header'
      },
      data: [],
      itemClass: 'date-item',
      listClass: 'date-list',
      methods: {
        __ready(){
          let theMon = this

          /**
           * 显示状态
           * false时， 整个结构去除， 包括占位容器
           * false时， 不响应tint， 不响应lazy
           */
          this.showStat = true   

          /**
           * 是否已经响应lazy
           * true时， 表示已经为展示状态
           * false时， 表示隐藏状态
           * 该状态值权重低于showStat
           * 该状态仅仅表示该月所有日期是否可见， 但不影响容器的占位
           */
          this.lazyDisplay = false  

          /**
           * 清空该月所有日期的选择状态
           */
          theMon.hooks.once('emptyChecked', function(cls={itemClass: 'selected'}) {
            theMon.forEach(item => {
              if (item.data && item.data.date) {
                let date = item.data.date
                let stamp = newDate(date).getTime()
                if (stamp >= that.validStartDay && stamp <= that.validEndDay) {
                  if (item.hasClass(cls.itemClass)) {
                    item.removeClass(`${cls.itemClass} range`)
                  }
                }
              }
            })
          })

          that.hooks.on('update-month-days', function(param){
            if (lib.isArray(param)) {
              monthDays = monthDays.map(day => {
                param.forEach(item=>{
                  let date = formatDate(item.date)
                  if (date === day.date) {
                    day = Object.assign({},day, (item.content||item))
                  }
                })
                return day
              })
            }
          })

          // 批量恢复初始月数据
          that.hooks.on('restore-month-days', function(param={}) {
            monthDays = originalMonthDays
            if (theMon.lazyDisplay) {
              theMon.fillMonth()
            }
          })
          
          // 重置showStat，使所有月份都能正常显示
          that.hooks.on('monthShowStat', function(param={}){
            if (param.hasOwnProperty('stat')) theMon.showStat = param.stat
            else {
              theMon.showStat = true
            }
          })
        },

        // 恢复初始月数据
        restore(){
          monthDays = originalMonthDays
        },

        // 当月是否可见
        // 在日历列表中隐藏当月结构
        // showStat为false时，完全隐藏结构且不会受到其他方法影响，如reset
        visible(bool=true){
          this.showStat = bool
        },

        getDate(){
          return {year, month}
        },

        // 渲染当月特定日期
        // spd = startPoint date
        // epd = endPoint Date
        // cls = className  指定样式
        tint(spd, epd, cls='selected', stat){
          let theMon = this
          if (!stat || stat === 'start') that.rangeValue = []

          // 该月处于lazy隐藏状态时，
          if (!this.lazyDisplay) {
            this.hooks.one('lazy', function(){
              theMon.tint(spd, epd, cls)
            })
            return
          }

          // 全部渲染
          if (!spd && !epd) {
            theMon.forEach(item=>{
              let data = item.data
              let date = data.date
              if (date) {
                stat ? that.rangeValue.push(item) : ''
                if (checkType==='range') {
                  item.addClass(cls+' range')

                } else {
                  item.addClass(cls)
                }
              }
            })
          }

          // 区间渲染(当月)
          if (spd && epd) {
            let spoint = getYmd(spd)
            let epoint = getYmd(epd)
            theMon.forEach(item => {
              let data = item.data
              let date = data.date
              if (date) {
                let day = data.day
                if (day >= spoint.day && day<=epoint.day) {
                  stat ? that.rangeValue.push(item) : ''
                  if (day > spoint.day && day < epoint.day) {
                    item.addClass(cls+ ' range')
                  } else {
                    item.addClass(cls)
                  }
                }
              }
            })
          }

          // 渲染start后所有日期
          if (spd && !epd){
            let point = getYmd(spd)
            theMon.forEach(item=>{
              let data = item.data
              let date = data.date
              if (date) {
                let day = data.day
                if (day >= point.day) {
                  stat ? that.rangeValue.push(item) : ''
                  if (day>point.day) {
                    item.addClass(cls+' range')
                  } else {
                    item.addClass(cls)
                  }
                }
              }
            })
          }

          // 渲染终止日期前所有日期
          if (!spd && epd) {
            let point = getYmd(epd)
            theMon.forEach(item => {
              let data = item.data
              let date = data.date
              if (date) {
                let day = data.day
                if (day <= point.day) {
                  stat ? that.rangeValue.push(item) : ''
                  if (day<point.day) {
                    item.addClass(cls+' range')
                  } else {
                    item.addClass(cls)
                  }
                }
              }
            })
          }
        },

        // 选中状态处理
        checked(e, param, inst){
          let theMon = this
          let date = param.date
          that.setValue(date, function (val) {
            if (checkType === 'multiple' && inst.hasClass('selected')) {
              inst.removeClass('selected range')
            } else {
              inst.addClass('selected')
              
              // 开始选择时间段，类似携程的入住，离店
              if (rangeMode === 2) {
                if (that.value.length === 1 && checkType === 'range') {
                  periodValidDays(param, rangeCount)
                }
              }
            }
            that.selectDate(e, param, inst)

            // tap=selected?date=2019-11-21
            // that.itemMethod.call(inst, e)
          })
        },

        // 响应tap事件
        onSelected(e, param, inst){
          if (inst.hasClass('invalid')) return
          this.checked(e, param, inst)
        },

        setChecked(targetDate){
          this.forEach(item=>{
            let data = item.data
            let date = data.date
            if (date === targetDate) {
              item.addClass('selected')
            }
          })
        },

        onSelectedMonth(e, param, inst) {
          that.selectDate(e, param, inst)
        },

        // lazy时用于清空数据
        emptyMonth(){
          if (this.showStat===false) return
          this.lazyDisplay = false
          this.reset()
        },

        // lazy时用于填充数据
        fillMonth(cb){
          let that = this
          if (this.showStat===false) return
          this.lazyDisplay = true
          if (lib.isFunction(cb)) {
            let date = year+'+'+month
            cb.call(this, date, monthDays)
          } else {
            this.update(monthDays, function() {
              that.hooks.emit('lazy')
            })
          }
        }
      }
    },
    id: `id-${year}-${month}`,
    attr: {
      id: `${this.calenderId}-${year}-${month}`
    }
  }
}

// 以月为单位生成日历
export function calendarMonths(timestart, end=5) {
  let {year, month, day} = getYmd(timestart)
  let configs = []
  let yearLoop = month
  for (let ii=0; ii<end; ii++) {
    if (yearLoop > 1 && yearLoop % 12 === 1) {
      year++
      yearLoop = 1
    }
    yearLoop++
    if (month+ii <= 12) {
      // configs.push( `${year}-${month+ii}-${day}` )
      configs.push( `${year}-${month+ii}-1` )
    } else {
      let mon = (month + ii)%12||12
      // configs.push(`${year}-${mon}-${day}`)
      configs.push(`${year}-${mon}-1`)
    }
  }

  let diffYear = parseInt((month+end)/12)
  let endYear = year + ((month+end)%12 ? diffYear : diffYear-1)
  let endMonth = ((month+end)%12) || 12
  let endDay = aboutMonth[endMonth]
  if (!endDay && endMonth === 2) {
    endDay = (isLeapYear(endYear) ? 29 : 28)
  }
  
  this.allMonths = configs
  this.validStartDay = this.validStartDay || newDate(`${year}-${month}-${day}`).getTime()
  this.validEndDay = this.validEndDay || newDate(`${endYear}-${endMonth}-${endDay}`).getTime()
  
  return configs.map(timepoint => oneMonthListConfig.call(this, timepoint))
}

/**
 * 以天为单位生成日历
 * @param {Date/timestamp} timestart 开始时间，为空则自动从当前开始
 * @param {Number} total 结束时间，后多少天
 * 通过结算得到结束时间的年月日，用 calendarMonths 方法生成日历
 */
export function calendarDays(timestart, total=30) {
  let day = 24*60*60*1000
  let startPoint = getYmd(timestart)
  let sp = startPoint
  let nowTime = newDate(`${sp.year}-${sp.month}-${sp.day}`).getTime()
  let endTime = nowTime+(total*day)
  let endDay = newDate(endTime)
  let endPoint = getYmd(endDay)
  let count = 1
  if (startPoint.year === endPoint.year) {
    count = endPoint.month - startPoint.month + 1
  } else {
    count = 12 - startPoint.month + 1 + endPoint.month
  }

  this.validStartDay = nowTime
  this.validEndDay = endTime
  return calendarMonths.call(this, timestart, count)
}