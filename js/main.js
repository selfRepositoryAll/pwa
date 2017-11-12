(function () {
  //If serviceWorker supports, then register it.
  if ("serviceWorker" in navigator) {
    // { scope: "./" } 注册咱哪
    // scope 只会接受 那个目录下的fetch事件;
    navigator.serviceWorker.register('./serviceWorker.js', { scope: "./" }) //setting scope of sw
      .then(function (registration) {
        console.info('Service worker is registered!');
        checkForPageUpdate(registration); // To check if new content is updated or not
      })
      .catch(function (error) {
        console.error('Service worker failed ', error);
      });
  }

  // To content update on service worker state change
  function checkForPageUpdate(registration) {
    console.log('registration', registration);

    console.log('33registration', registration);
    // onupdatefound will fire on first time install and when serviceWorker.js file changes    
      // 只是增加
    registration.addEventListener("updatefound", function () {
      console.log('===================================>updatefound');
      // To check if service worker is already installed and controlling the page or not
      if (navigator.serviceWorker.controller) {
        console.log('===================================>1');
        var installingSW = registration.installing;
        // 安装中的 installing
        // 状态发生改变  定义了
        installingSW.onstatechange = function () {
          console.info("Service Worker State :", installingSW.state);
          switch (installingSW.state) {
            case 'installed':
              // Now new contents will be added to cache and old contents will be remove so
              // this is perfect time to show user that page content is updated.
              console.log('===================================>2');
              toast('Site is updated. Refresh the page.', 5000);
              break;
            case 'redundant':
            console.log('===================================>3');
              throw new Error('The installing service worker became redundant.');
          }
        }
      }
    });
  }
})();
