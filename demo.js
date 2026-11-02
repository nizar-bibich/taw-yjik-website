var orders = {},
  mins = 5,
  watch = null,
  shown = "",
  sig = "",
  lastR = false,
  ac = null;
var $ = function (i) {
  return document.getElementById(i);
};
function norm(s) {
  return String(s)
    .replace(/[\u0660-\u0669]/g, function (d) {
      return d.charCodeAt(0) - 1632;
    })
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "");
}
function safe(f) {
  try {
    return f();
  } catch (e) {
    return null;
  }
}
function unlock() {
  safe(function () {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    ac.resume();
  });
}
function beep() {
  if (!ac) return;
  [
    { delay: 0, duration: 0.24, from: 220, to: 145, volume: 0.26, type: "sine" },
    { delay: 0.02, duration: 0.32, from: 680, to: 1080, volume: 0.42, type: "triangle" },
    { delay: 0.27, duration: 0.48, from: 920, to: 1480, volume: 0.36, type: "triangle" },
  ].forEach(function (tone) {
    var start = ac.currentTime + tone.delay,
      end = start + tone.duration,
      o = ac.createOscillator(),
      g = ac.createGain();
    o.type = tone.type;
    o.frequency.setValueAtTime(tone.from, start);
    o.frequency.exponentialRampToValueAtTime(tone.to, start + tone.duration * 0.42);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(tone.volume, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.connect(g);
    g.connect(ac.destination);
    o.start(start);
    o.stop(end);
  });
}
function drawTimes() {
  $("times").innerHTML = [1, 5, 10, 15]
    .map(function (m) {
      return (
        '<button class="t' +
        (m === mins ? " on" : "") +
        '" data-m="' +
        m +
        '">' +
        m +
        "</button>"
      );
    })
    .join("");
}
function pct(o) {
  return o.status === "ready"
    ? 100
    : Math.min(100, Math.max(0, 100 - ((o.readyAt - Date.now()) / o.total) * 100));
}
function remainingTime(o) {
  if (o.status === "ready") return "جاهز";
  var difference = o.readyAt - Date.now(),
    seconds = Math.ceil(Math.abs(difference) / 1000),
    time = Math.floor(seconds / 60) + ":" + (seconds % 60 < 10 ? "0" : "") + (seconds % 60);
  return difference <= 0 ? "+" + time : time;
}
function isLate(o) {
  return o.status === "prep" && Date.now() >= o.readyAt;
}
function renderOrderRows(ids, emptyMessage) {
  if (!ids.length) return '<div class="list-empty">' + emptyMessage + "</div>";
  return ids
    .map(function (k) {
      var o = orders[k];
      return (
        '<div class="row" data-k="' +
        k +
        '"><div class="row-main"><span class="num">' +
        k +
        '</span><div class="bar"><i style="width:' +
        pct(o) +
        '%"></i></div><span class="remaining' +
        (o.status === "ready" ? " done" : isLate(o) ? " late" : "") +
        '">' +
        remainingTime(o) +
        '</span><button class="rd" data-rd="' +
        k +
        '">جاهز</button>' +
        '</div>' +
        (o.status === "prep"
          ? '<div class="row-extra"><span class="delay-indicator"' +
            (isLate(o) ? "" : " hidden") +
            '>متأخر</span><span>وقت إضافي</span><button class="extra-time" data-extra-order="' +
            k +
            '" data-extra-minutes="5" aria-label="إضافة 5 دقائق للطلب ' +
            k +
            '">+5 دق</button><button class="extra-time" data-extra-order="' +
            k +
            '" data-extra-minutes="10" aria-label="إضافة 10 دقائق للطلب ' +
            k +
            '">+10 دق</button></div>'
          : "") +
        "</div>"
      );
    })
    .join("");
}
function renderList() {
  var ids = Object.keys(orders).sort(function (a, b) {
      return orders[a].readyAt - orders[b].readyAt;
    }),
    waitingIds = ids.filter(function (k) {
      return orders[k].status === "prep";
    }),
    s = ids
      .map(function (k) {
        return k + orders[k].status;
      })
      .join();
  $("waitingCount").textContent = waitingIds.length;
  if (s !== sig) {
    sig = s;
    $("waitingList").innerHTML = renderOrderRows(waitingIds, "لا توجد طلبات في الانتظار");
  } else {
    $("waitingList").querySelectorAll(".row").forEach(function (r) {
      var o = orders[r.dataset.k];
      if (o) {
        r.querySelector(".bar i").style.width = pct(o) + "%";
        r.querySelector(".remaining").textContent = remainingTime(o);
        r.querySelector(".remaining").classList.toggle("late", isLate(o));
        r.querySelector(".delay-indicator").hidden = !isLate(o);
      }
    });
  }
}
function renderCust() {
  var k = watch;
  if (!k) {
    $("cIn").classList.remove("hide");
    $("cOut").classList.add("hide");
    shown = "";
    return;
  }
  $("cIn").classList.add("hide");
  $("cOut").classList.remove("hide");
  var o = orders[k],
    box = $("cOut"),
    back = '<br><button class="big big-secondary" id="back">تتبّع طلبًا آخر</button>';
  if (!o) {
    if (shown !== "nf") {
      box.innerHTML =
        "<p>رقم الطلب غير موجود. أضِف الطلب أولًا من شاشة الموظف.</p>" + back;
      shown = "nf";
    }
    return;
  }
  if (o.status === "ready") {
    if (shown !== "rd" + k) {
      box.innerHTML =
        '<div class="ready">' +
        '<div class="ready-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></div><b>كوموندك جاهزة!</b>طلب رقم ' +
        k +
        '<br>تفضّل للكنتوار</div>' +
        back;
      shown = "rd" + k;
    }
    return;
  }
  var difference = o.readyAt - Date.now(),
    ms = Math.max(0, difference),
    late = difference <= 0,
    s = Math.ceil(Math.abs(difference) / 1000),
    C = 2 * Math.PI * 88;
  if (shown !== "tm" + k) {
    box.innerHTML =
      '<div class="mut" style="text-align:center">طلب رقم ' +
      k +
      '</div><div class="ring" id="orderTimerRing"><svg viewBox="0 0 200 200"><defs><linearGradient id="timer-gradient" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stop-color="#d946ef"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs><circle class="tr" cx="100" cy="100" r="88" fill="none" stroke-width="14"/><circle class="pr" id="pr" cx="100" cy="100" r="88" fill="none" stroke-width="14" stroke-linecap="round" stroke-dasharray="' +
      C +
      '"/></svg><div class="mid"><div class="timer" id="tm"></div><div class="mut" id="timerLabel"></div></div></div><p style="text-align:center;margin:4px 0 12px">طلبك قيد التحضير</p>' +
      back;
    shown = "tm" + k;
  }
  $("orderTimerRing").classList.toggle("late", late);
  $("pr").style.strokeDashoffset = C * (1 - Math.min(1, ms / o.total));
  $("tm").textContent = (late ? "+" : "") + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  $("timerLabel").textContent = late ? "مدة التأخير" : "الوقت المتبقي";
}
document.addEventListener("click", function (e) {
  var el = e.target.closest("button");
  if (!el) return;
  if (el.dataset.m) {
    mins = +el.dataset.m;
    drawTimes();
  } else if (el.id === "add") {
    var n = norm($("sNum").value);
    if (!n) {
      $("sNum").focus();
      return;
    }
    if (orders[n]) {
      $("staffMessage").textContent = "رقم الطلب موجود بالفعل في قائمة الطلبات النشطة.";
      return;
    }
    $("staffMessage").textContent = "";
    orders[n] = {
      status: "prep",
      total: mins * 60000,
      readyAt: Date.now() + mins * 60000,
    };
    $("sNum").value = "";
    sig = "";
    renderList();
    renderCust();
  } else if (el.dataset.extraMinutes) {
    var order = orders[el.dataset.extraOrder],
      addedMs = Number(el.dataset.extraMinutes) * 60000;
    if (!order || order.status !== "prep") return;
    order.total += addedMs;
    order.readyAt += addedMs;
    renderList();
    if (watch) renderCust();
  } else if (el.dataset.rd) {
    orders[el.dataset.rd].status = "ready";
    if (watch === el.dataset.rd && !lastR) {
      safe(function () {
        navigator.vibrate([300, 150, 300]);
      });
      safe(beep);
      lastR = true;
    }
    sig = "";
    renderList();
    renderCust();
  } else if (el.id === "track") {
    var c = norm($("cNum").value);
    if (!c) {
      $("cNum").focus();
      return;
    }
    unlock();
    watch = c;
    lastR = false;
    shown = "";
    renderCust();
  } else if (el.id === "back") {
    watch = null;
    $("cNum").value = "";
    shown = "";
    renderCust();
  }
});
$("sNum").addEventListener("keydown", function (e) {
  if (e.key === "Enter") $("add").click();
});
$("sNum").addEventListener("input", function () {
  $("staffMessage").textContent = "";
});
$("cNum").addEventListener("keydown", function (e) {
  if (e.key === "Enter") $("track").click();
});
setInterval(function () {
  renderList();
  if (watch) renderCust();
}, 1000);
drawTimes();
renderList();
