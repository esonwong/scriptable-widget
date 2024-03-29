var dur_month = 1;

// [Reminder] id
const rmemberIdReg = /(\[Reminder\])\s([A-Z0-9\-]*)/;
// [DueDate] dueDate
const reminderDueDateReg = /(\[DueDate\])\s(\d*)/;

const startDate = new Date();
startDate.setMonth(startDate.getMonth() - dur_month);
console.log(`日历的开始时间 ${startDate.toLocaleDateString()}`);

const endDate = new Date();
endDate.setMonth(endDate.getMonth() + dur_month);
console.log(`日历的结束时间 ${endDate.toLocaleDateString()}`);

const reminders = await Reminder.allDueBetween(startDate, endDate);
console.log(`获取 ${reminders.length} 条提醒事项`);

var calendar = await Calendar.forEvents();

//获取日历名和对应的日历
var m_dict = {};
for (cal of calendar) {
  m_dict[cal.title] = cal;
  //console.log(`日历:${cal.title}`)
}

const events = await CalendarEvent.between(startDate, endDate, calendar);
console.log(`获取 ${events.length} 条日历`);

var reminders_id_set = new Set(reminders.map((e) => e.identifier));

//删除日历里提醒事项删除的事项
events_created = events.filter(
  (e) => e.notes != null && e.notes.includes("[Reminder]")
);
for (let event of events_created) {
  let r = event.notes.match(rmemberIdReg);
  if (!reminders_id_set.has(r[2])) {
    event.remove();
  }
}

for (const reminder of reminders) {
  //reminder的标识符
  const reminderIdNote = `[Reminder] ${reminder.identifier}`;

  const targetEvent = events.find(
    (e) => e.notes != null && e.notes.includes(reminderIdNote)
  );

  if (!m_dict[reminder.calendar.title]) {
    console.warn("找不到日历" + reminder.calendar.title);
    continue;
  }

  if (targetEvent) {
    updateEvent(targetEvent, reminder);
  } else {
    console.log(`创建日历事项 ${reminder.title} 到 ${reminder.calendar.title}`);
    const newEvent = new CalendarEvent();
    updateEvent(newEvent, reminder);
  }
}

Script.complete();

function updateEvent(event, reminder) {
  const oldReminderDueDate = event.notes?.match?.(reminderDueDateReg)?.[2];

  // 从日历更新开始时间到提醒事项
  if (oldReminderDueDate && oldReminderDueDate !== event.startDate.getTime()) {
    reminder.dueDate = event.startDate;
    reminder.save();
  }

  const reminderIdNote = `[Reminder] ${reminder.identifier}`;
  const reminderDueDateNote = `[DueDate] ${reminder.dueDate.getTime()}`;
  event.notes = `
${reminderIdNote}
${reminderDueDateNote}
${reminder.notes || "无备注"}`;

  event.title = `${reminder.title}`;
  cal_name = reminder.calendar.title;
  cal = m_dict[cal_name];
  event.calendar = cal;
  //console.warn(event.calendar.title)
  if (reminder.isCompleted) {
    //已完成事项

    event.title = `✅${reminder.title}`;
    event.isAllDay = true;
    event.startDate = reminder.dueDate;
    //    event.endDate=reminder.dueDate
    //     var ending = new Date(reminder.completionDate)
    //     ending.setHours(ending.getHours()+1)
    //     event.endDate = ending

    var period =
      (reminder.dueDate - reminder.completionDate) / 1000 / 3600 / 24;
    period = period.toFixed(1);
    if (period < 0) {
      period = -period;
      event.location = " 延期" + period + "天完成";
    } else if (period == 0) {
      event.location = " 准时完成";
    } else {
      event.location = " 提前" + period + "天完成";
    }
  } else {
    //未完成事项

    const nowtime = new Date();
    var period = (reminder.dueDate - nowtime) / 1000 / 3600 / 24;
    period = period.toFixed(1);
    //console.log(reminder.title+(period))
    if (period < 0) {
      //待办顺延

      event.location = " 延期" + -period + "天";

      if (reminder.dueDate.getDate() != nowtime.getDate()) {
        //如果不是在同一天,设置为全天事项

        event.title = `❌${reminder.title}`;
        event.startDate = nowtime;
        event.endDate = nowtime;
        event.isAllDay = true;
      } else {
        //在同一天的保持原来的时间

        event.title = `⭕️${reminder.title}`;
        event.isAllDay = false;
        event.startDate = reminder.dueDate;
        var ending = new Date(reminder.dueDate);
        ending.setHours(ending.getHours() + 1);
        event.endDate = ending;
      }
      console.log(`【${reminder.title}】待办顺延${-period}天`);
    } else {
      // 未延期待办

      console.log(`【${reminder.title}未延期待办`);

      event.title = `⭕️${reminder.title}`;
      event.isAllDay = false;
      event.location = "还剩" + period + "天";
      event.startDate = reminder.dueDate;
      var ending = new Date(reminder.dueDate);
      ending.setHours(ending.getHours() + 1);
      event.endDate = ending;
    }
  }
  if (!reminder.dueDateIncludesTime) {
    console.log(`【${reminder.title}】全天日程`);
    event.isAllDay = true;
    event.endDate = new Date(event.startDate.getTime() + 24 * 60 * 60 * 1000);
  } else {
    console.log(
      `【${reminder.title}】开始时间 ${event.startDate} 结束时间 ${event.endDate}`
    );
  }

  console.log(`【${reminder.title}】 Save`);
  try {
    event.save();
  } catch (e) {
    console.error(e);
    console.error(event);
  }
}
