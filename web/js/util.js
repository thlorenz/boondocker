'use strict'

exports.isPhone = function isPhone() {
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

exports.addToHomeScreen = function addToHomeScreen() {
  const opts = {
    appID               : 'org.boondocker.addtohome', // local storage name
    fontSize            : 15,                         // base font size, used to properly resize the popup based on viewport scale factor
    debug               : false,                      // override browser checks
    logging             : false,                      // log reasons for showing or not showing to js console; defaults to true when debug is true
    modal               : false,                      // prevent further actions until the message is closed
    mandatory           : false,                      // you can't proceed if you don't add the app to the homescreen
    autostart           : true,                       // show the message automatically
    skipFirstVisit      : false,                      // show only to returning visitors (ie: skip the first time you visit)
    startDelay          : 1,                          // display the message after that many seconds from page load
    lifespan            : 15,                         // life of the message in seconds
    displayPace         : 600,                        // minutes before the message is shown again (0: display every time, set to 10 hours)
    maxDisplayCount     : 0,                          // absolute maximum number of times the message will be shown to the user (0: no limit)
    icon                : false,                      // add touch icon to the message
    message             : '',                         // the message can be customized
    validLocation       : [],                         // list of pages where the message will be shown (array of regexes)
    onInit              : null,                       // executed on instance creation
    onShow              : null,                       // executed when the message is shown
    onRemove            : null,                       // executed when the message is removed
    onAdd               : null,                       // when the application is launched the first time from the homescreen (guesstimate)
    onPrivate           : null,                       // executed if user is in private mode
    privateModeOverride : false,                      // show the message even in private mode (very rude)
    detectHomescreen    : true                        // try to detect if the site has been added to the homescreen (false | true | 'hash' | 'queryString' | 'smartURL')
  }
  window.addToHomescreen(opts)
}
