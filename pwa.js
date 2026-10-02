/* =============================================================
   📲 PWA 注册（离线玩 + 添加到主屏幕）
   -------------------------------------------------------------
   只在「通过网址打开」时注册 Service Worker。
   从「文件」App 直接打开（file://）时不注册 —— 那种情况下
   SW 根本用不了，而且 iOS 还会禁用 localStorage。

   装好之后：
     · 断网 / 飞行模式照样能玩
     · 添加到主屏幕后全屏横屏运行，像原生 App
     · 存档正常保存（同源 localStorage）
   ============================================================= */
(function () {
  'use strict';

  var isFile = location.protocol === 'file:';
  var canSW = 'serviceWorker' in navigator && !isFile;

  /* ---------- 兜底：存储不可用时提醒 ---------- */
  function storageWarn() {
    try {
      localStorage.setItem('__probe__', '1');
      localStorage.removeItem('__probe__');
      return;
    } catch (e) { /* 不可用，往下走 */ }
    var bar = document.createElement('div');
    bar.id = 'pwaWarn';
    bar.innerHTML = '⚠️ <b>这个打开方式不保存进度</b>' +
      '（iOS 从「文件」App 直接打开会禁用本地存储）。<br>' +
      '请改用<b>网址</b>打开，或到「设置」里用 <b>📤 导出存档</b> 手动备份。';
    document.body.appendChild(bar);
  }

  /* ---------- 离线小提示条 ---------- */
  function statusBar() {
    var bar = document.createElement('div');
    bar.id = 'pwaBar';
    document.body.appendChild(bar);
    var t = null;
    function show(msg, cls, ms) {
      bar.textContent = msg;
      bar.className = cls || '';
      bar.classList.add('show');
      clearTimeout(t);
      if (ms) t = setTimeout(function () { bar.classList.remove('show'); }, ms);
    }
    window.__pwaToast = show;
    window.addEventListener('offline', function () { show('📴 已离线 —— 照样能玩', 'off', 2600); });
    window.addEventListener('online', function () { show('🌐 已恢复联网', 'on', 1800); });
  }

  /* ---------- 安装进度 ---------- */
  function progressUI() {
    var box = document.createElement('div');
    box.id = 'pwaInstall';
    box.innerHTML =
      '<div class="pi-card">' +
      '  <div class="pi-title">📲 正在准备离线版…</div>' +
      '  <div class="pi-sub">首次打开要把游戏存到手机上，之后就能离线玩了</div>' +
      '  <div class="pi-track"><i></i></div>' +
      '  <div class="pi-num">0%</div>' +
      '</div>';
    document.body.appendChild(box);
    var fill = box.querySelector('.pi-track i');
    var num = box.querySelector('.pi-num');
    var title = box.querySelector('.pi-title');
    var sub = box.querySelector('.pi-sub');
    return {
      set: function (done, total) {
        var p = total ? Math.round(done / total * 100) : 0;
        fill.style.width = p + '%';
        num.textContent = p + '%　(' + done + '/' + total + ')';
      },
      done: function () {
        title.textContent = '✅ 离线版已就绪';
        sub.textContent = '现在断网也能玩了。想看全屏效果，点 Safari 底部的「分享」→「添加到主屏幕」。';
        box.classList.add('ok');
        setTimeout(function () { box.classList.remove('show'); }, 4200);
      },
      hide: function () { box.classList.remove('show'); }
    };
  }

  /* ---------- 注册 ---------- */
  function register() {
    if (!canSW) {
      if (isFile) storageWarn();
      return;
    }
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (reg) {
      var ui = null;                       // 懒创建：只在"真的在装"时才弹出进度框
      function ensureUI() {
        if (ui) return ui;
        ui = progressUI();
        document.getElementById('pwaInstall').classList.add('show');
        return ui;
      }
      /* SW 主动推来的进度 / 状态 */
      navigator.serviceWorker.addEventListener('message', function (ev) {
        var d = ev.data || {};
        if (d.type === 'sw-progress') {
          ensureUI().set(d.done, d.total);
        } else if (d.type === 'sw-status') {
          if (d.ready) { if (ui) ui.done(); }        // 已完整缓存：只在开过进度框时提示"就绪"
          else { ensureUI().set(d.cached, d.total); } // 没装完：显示进度
        }
      });
      navigator.serviceWorker.ready.then(function () {
        var sw = navigator.serviceWorker.controller || reg.active;
        if (sw) sw.postMessage({ type: 'sw-status' });
      });
      /* 新版本装好后自动刷新一次，保证用的是最新代码 */
      var refreshed = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshed) return;
        refreshed = true;
        location.reload();
      });
    }).catch(function (e) {
      /* 注册失败不影响游戏本体，静默即可 */
      if (window.console) console.warn('SW 注册失败：', e && e.message);
    });
  }

  function boot() {
    statusBar();
    var isStandalone = window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    /* 已装到主屏幕就不再提示安装 */
    if (!isStandalone && !isFile) {
      var tip = document.createElement('div');
      tip.id = 'pwaTip';
      tip.innerHTML = '📲 想出门也能玩？点 Safari 底部「分享」→「添加到主屏幕」';
      document.body.appendChild(tip);
      tip.classList.add('show');
      tip.onclick = function () { tip.classList.remove('show'); };
      setTimeout(function () { tip.classList.remove('show'); }, 9000);
    }
    register();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
