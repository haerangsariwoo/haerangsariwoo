/**
 * 해랑사리우 푸시 알림 서비스워커.
 * 공지가 등록되면 서버가 web-push 로 이 워커에 알림을 보낸다.
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "해랑사리우", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "해랑사리우", {
      body: data.body ?? "",
      icon: data.icon ?? "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      lang: "ko",
      vibrate: [80, 40, 80],
      // 같은 공지가 여러 번 오면 하나로 합친다
      tag: data.tag ?? "haerang-notice",
      renotify: Boolean(data.tag),
      data: { url: data.url ?? "/home" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url ?? "/home", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // 이미 앱이 열려 있으면 그 창을 재사용한다
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
