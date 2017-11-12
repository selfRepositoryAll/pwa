//Cache polyfil to support cacheAPI in all browsers
// 看来有很多浏览器的情况下，都不支持缓存
// importScripts('./cache-polyfill.js');

var cacheName = 'cache-v4';

//Files to save in cache
var files = [
  './',
  './index.html?utm=homescreen', //SW treats query string as new request
  './css/styles.css',
  './images/icons/android-chrome-192x192.png',
  './images/push-on.png',
  './images/push-off.png',
  './images/icons/favicon-16x16.png',
  './images/icons/favicon-32x32.png',
  './js/main.js',
  './js/app.js',
  './js/offline.js',
  './js/push.js',
  './js/sync.js',
  './js/toast.js',
  './js/share.js',
  './js/menu.js',
  './manifest.json'
];
// 件所有的事件绑定， 等触发某个事件的时候就会触发对应的事件回调
//Adding `install` event listener
// // self 为当前 scope 内的上下文
self.addEventListener('install', (event) => {
  console.info('Event: Install');
// 注册的时候 必须要缓存的。 一些静态文件的缓存，同事间
// 这会确保Service Worker 不会在 waitUntil() 里面的代码执行完毕之前安装完成
// 删除缓存
  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => {
        console.log('>>>>>>>>；4>>');
        console.log(cache);
        //[] of files to cache & if any of the file not present `addAll` will fail
        return cache.addAll(files)
          .then((content) => {
            console.log('content', content);
            console.info('All files are cached');
            // 将等待的
            return self.skipWaiting(); //To forces the waiting service worker to become the active service worker
          })
          .catch((error) => {
            console.error('Failed to cache', error);
          })
      })
  );
});

/*
  FETCH EVENT: triggered for every request made by index page, after install.
*/

//Adding `fetch` event listener
// 只是单纯的发送ajax pwa 会调用这个
self.addEventListener('fetch', (event) => {
  console.info('Event: Fetch');

  var request = event.request;
  console.log('Event: Fetch request', request);
  //Tell the browser to wait for newtwork request and respond with below
  event.respondWith(
    //If request is already in cache, return it
    // 并发执行的
    //  看一下缓存里面有吗，
    caches.match(request).then((response) => {
      console.log('response', response);
      if (response) {
        return response;
      }

      // // Checking for navigation preload response
      // if (event.preloadResponse) {
      //   console.info('Using navigation preload');
      //   return response;
      // }

      //if request is not cached or navigation preload response, add it to cache
      return fetch(request).then((response) => {
        var responseToCache = response.clone();
        console.log('responseToCache', responseToCache);
        
        caches.open(cacheName).then((cache) => {
          console.log('request, responseToCache');
          console.log(request, responseToCache);
          cache.put(request, responseToCache).catch((err) => {
            console.warn(request.url + ': ' + err.message);
          });
        });

        return response;
      });
    })
  );
});

/*
  ACTIVATE EVENT: triggered once after registering, also used to clean up caches.
*/

//Adding `activate` event listener
self.addEventListener('activate', (event) => {
  console.info('Event: ========================><<>>>221>><<<=============');

  //Navigation preload is help us make parallel request while service worker is booting up.
  //Enable - chrome://flags/#enable-service-worker-navigation-preload
  //Support - Chrome 57 beta (behing the flag)
  //More info - https://developers.google.com/web/updates/2017/02/navigation-preload#the-problem

  // Check if navigationPreload is supported or not
  // if (self.registration.navigationPreload) { 
  //   self.registration.navigationPreload.enable();
  // }
  // else if (!self.registration.navigationPreload) { 
  //   console.info('Your browser does not support navigation preload.');
  // }

  //Remove old and unwanted caches
  event.waitUntil(
    // caches 也是一个数组
    caches.keys().then((cacheNames) => {
      console.log('cacheNames', cacheNames);
      // cacheName是一个 数组 每 每次上线的时候就改变想要更行的cache 版本。 cache v1 = 》v4
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== cacheName) {
            return caches.delete(cache); //Deleting the old cache (cache v1)
          }
        })
      );
    })
      .then(function () {
        console.info("Old caches are cleared!");
        // To tell the service worker to activate current one 
        // instead of waiting for the old one to finish.
        // 更新所有客户端上的 Service Worker。
        // 强制更新 所有的workder实例
        return self.clients.claim();
      })
  );
});

/*
  PUSH EVENT: triggered everytime, when a push notification is received.
*/

//Adding `push` event listener
self.addEventListener('push', (event) => {
  console.info('Event: Push');

  var title = 'Push notification demo';
  var body = {
    'body': 'click to return to application',
    'tag': 'demo',
    'icon': './images/icons/apple-touch-icon.png',
    'badge': './images/icons/apple-touch-icon.png',
    //Custom actions buttons
    'actions': [
      { 'action': 'yes', 'title': 'I ♥ this app!' },
      { 'action': 'no', 'title': 'I don\'t like this app' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, body));
});

/*
  BACKGROUND SYNC EVENT: triggers after `bg sync` registration and page has network connection.
  It will try and fetch github username, if its fulfills then sync is complete. If it fails,
  another sync is scheduled to retry (will will also waits for network connection)
*/

self.addEventListener('sync', (event) => {
  console.info('Event: Sync');

  //Check registered sync name or emulated sync from devTools
  if (event.tag === 'github' || event.tag === 'test-tag-from-devtools') {
    event.waitUntil(
      //To check all opened tabs and send postMessage to those tabs
      self.clients.matchAll().then((all) => {
        return all.map((client) => {
          return client.postMessage('online'); //To make fetch request, check app.js - line no: 122
        })
      })
        .catch((error) => {
          console.error(error);
        })
    );
  }
});

/*
  NOTIFICATION EVENT: triggered when user click the notification.
*/

//Adding `notification` click event listener
self.addEventListener('notificationclick', (event) => {
  var url = 'https://demopwa.in/';

  //Listen to custom action buttons in push notification
  if (event.action === 'yes') {
    console.log('I ♥ this app!');
  }
  else if (event.action === 'no') {
    console.warn('I don\'t like this app');
  }

  event.notification.close(); //Close the notification

  //To open the app after clicking notification
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
      .then((clients) => {
        for (var i = 0; i < clients.length; i++) {
          var client = clients[i];
          //If site is opened, focus to the site
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        //If site is cannot be opened, open in new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
      .catch((error) => {
        console.error(error);
      })
  );
});
