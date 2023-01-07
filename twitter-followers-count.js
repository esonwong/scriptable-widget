// 作者： @eson000
// Scriptable twitter follow count

const userName = args.widgetParameter || "eson000";

let widget;

try {
  let result = await getData();
  console.log(result);
  const { history, avatarUrl } = result;
  let avatar = await loadAvatar(avatarUrl.replace("_normal", "_bigger"));
  widget = await createWidget(history, avatar, config.widgetFamily);
} catch (e) {
  console.error(e);
  widget = await createLogWidget(e.message);
}

if (config.runsInWidget) {
  // The script runs inside a widget, so we pass our instance of ListWidget to be shown inside the widget on the Home Screen.
  Script.setWidget(widget);
} else {
  // The script runs inside the app, so we preview the widget.
  widget.presentMedium();
}

// Calling Script.complete() signals to Scriptable that the script have finished running.
// This can speed up the execution, in particular when running the script from Shortcuts or using Siri.
Script.complete();

async function createLogWidget(logObj) {
  let widget = new ListWidget();

  let descriptionElement = widget.addText(JSON.stringify(logObj));
  descriptionElement.minimumScaleFactor = 0.5;
  descriptionElement.textColor = Color.red();
  descriptionElement.font = Font.systemFont(18);

  return widget;
}
/**
 * Create widget
 * @param {Array} history
 * @param {Image} avatar
 * @param {string} widgetFamily small, medium, large extraLarge and null.
 **/
async function createWidget(history, avatar, widgetFamily) {
  switch (widgetFamily) {
    case "small":
      return await createSmallWidget(history, avatar);
    case "medium":
      return await createMediumWidget(history, avatar);
    case "large":
      return await createLargeWidget(history, avatar);
    default:
      return await createDefaultWidget(history, avatar);
  }
}

async function createDefaultWidget(history, avatar) {
  let widget = new ListWidget();

  widget.backgroundColor = Color.white();
  const followersCountStack = renderFollowersText(widget, history);
  followersCountStack.addSpacer(4);

  return widget;
}

async function createSmallWidget(history, avatar) {
  let widget = new ListWidget();

  widget.backgroundColor = Color.white();

  // Show avatar
  let avatarStack = widget.addStack();
  let avatarElement = avatarStack.addImage(avatar);
  avatarElement.imageSize = new Size(64, 64);
  avatarElement.cornerRadius = 4;
  avatarStack.centerAlignContent();

  widget.addSpacer(4);

  // Show user name
  let userNameStack = widget.addText(userName);
  userNameStack.textColor = Color.black();
  userNameStack.textOpacity = 0.8;
  userNameStack.font = Font.mediumSystemFont(13);

  widget.addSpacer(12);

  // Show followers count
  const followersCountStack = renderFollowersText(widget, history);
  followersCountStack.addSpacer(4);

  // UI presented in Siri ans Shortcuta is non-interactive, so we only show the footer when not running the script from Siri.
  if (!config.runsWithSiri) {
    widget.addSpacer(8);
  }
  return widget;
}

async function createMediumWidget(history, avatar) {
  return createDefaultWidget(history, avatar);
}

async function createLargeWidget(history, avatar) {
  return createMediumWidget(history, avatar);
}

function renderFollowersText(widget, history) {
  let followersCountStack = widget.addStack();
  let text = `${history[history.length - 1].followersCount} 👤` || "0 👤";
  let textElement = followersCountStack.addText(text);
  textElement.textColor = Color.black();
  textElement.font = Font.systemFont(18);

  if (history.length > 1) {
    let increase =
      history[history.length - 1].followersCount -
      history[history.length - 2].followersCount;
    switch (true) {
      case increase > 0:
        followersCountStack.addSpacer(4);
        let increaseText = followersCountStack.addText(`+${increase}`);
        increaseText.textColor = Color.green();
        increaseText.font = Font.systemFont(18);
        break;
      case increase < 0:
        followersCountStack.addSpacer(4);
        let decreaseText = followersCountStack.addText(`${increase}`);
        decreaseText.textColor = Color.red();
        decreaseText.font = Font.systemFont(18);
        break;
      default:
        break;
    }
  }
  return followersCountStack;
}

async function getData() {
  let url = `https://worker-api.esonwong.com/twitter/profile/${userName}/v2`;
  let req = new Request(url);
  return await req.loadJSON();
}

// 加载头像
async function loadAvatar(url) {
  let req = new Request(url);
  return req.loadImage();
}
