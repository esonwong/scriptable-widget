// 作者： @eson000
// Scriptable twitter follow count

const userName = "eson000",

// 到 https://developer.twitter.com/en/portal/dashboard 获取token
bearerToken = "xxxxx";

let widget

try {
  let result = await load();
  let info = result.data;
  let avatar = await loadAvatar(info.profile_image_url.replace("_normal", "_bigger"));

  widget = await createWidget(info, avatar)
  // widget = await createLogWidget(info);
} catch (e) {
  console.error(e)
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

  let descriptionElement = widget.addText(JSON.stringify(logObj));·
	descriptionElement.minimumScaleFactor = 0.5;
  descriptionElement.textColor = Color.red();
  descriptionElement.font = Font.systemFont(18);

  return widget;
}

async function createWidget(info, avatar) {
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
	let followersCountStack = widget.addStack();
  let descriptionElement = followersCountStack.addText(`${info.public_metrics.followers_count}`);
  descriptionElement.minimumScaleFactor = 0.5;
  descriptionElement.textColor = Color.black();
  descriptionElement.font = Font.systemFont(18);
	followersCountStack.addSpacer(4);
	let followersText = followersCountStack.addText("Followers");
	followersText.minimumScaleFactor = 0.5;
	followersText.textColor = Color.black();
	followersText.textOpacity = 0.5;

  // UI presented in Siri ans Shortcuta is non-interactive, so we only show the footer when not running the script from Siri.
  if (!config.runsWithSiri) {

    widget.addSpacer(8);

  }
  return widget;
}

async function load() {
  let url = `https://api.twitter.com/2/users/by/username/${userName}?user.fields=public_metrics,profile_image_url`;
  let req = new Request(url);
	req.headers = {
		Authorization: `Bearer ${bearerToken}`,
	};
  return await req.loadJSON();
}

// 加载头像
async function loadAvatar(url) {
  let req = new Request(url);
  return req.loadImage();
}