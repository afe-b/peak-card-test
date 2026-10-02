/* =============================================================
   🏀 巅峰球星卡 · Service Worker（离线玩）
   -------------------------------------------------------------
   做两件事：
     ① **安装时**把游戏要用到的全部文件抓进 Cache Storage
        （HTML / CSS / JS / 542 张卡图，约 24 MB）
     ② 之后**所有请求都从缓存返回** —— 断网、飞行模式照样玩

   为什么这样设计：
     · iOS Safari 的 localStorage 是**按源（origin）隔离**的，
       只要一直从同一个网址打开，存档就一直在；
       而 Service Worker 让"同一个网址"在离线时也能打开。
     · 缓存策略选 **cache-first**：游戏是纯本地逻辑，
       没有需要实时性的接口，所以缓存优先最快、也最省电。

   更新机制：
     改了源码后重新跑 `node tools/build-single.js` 会**自动改掉
     下面的 VERSION**（构建脚本会注入），浏览器看到 SW 文件变了
     就会装新版并清掉旧缓存。所以不需要手动清缓存。
   ============================================================= */

const VERSION = "a1a50167c2";        // 构建时注入（按内容哈希）
const CACHE = 'peak-card-' + VERSION;

/* 构建时注入的完整文件清单（含 542 张卡图） */
const ASSETS = ["index.html","data.js","badge-fx.js","arena-audio.js","app.js","battle.js","coach.js","league.js","season.js","hof.js","quests.js","career.js","teamui.js","pwa.js","pwa.css","cards.css","viewer.css","holo.css","battle.css","league.css","landscape.css","career.css","teamui.css","platform.css","cardv2.css","img/aaron-brooks.webp","img/aaron-gordon.webp","img/adam-morrison.webp","img/al-farouq-aminu.webp","img/al-harrington.webp","img/al-horford.webp","img/al-jefferson.webp","img/aleksandar-or-evic.webp","img/alex-abrines.webp","img/alex-caruso.webp","img/alex-len.webp","img/alexey-shved.webp","img/allan-houston.webp","img/allen-iverson-m.webp","img/allen-iverson.webp","img/alonzo-mourning-m.webp","img/alonzo-mourning.webp","img/alperen-sengun.webp","img/amar-e-stoudemire-m.webp","img/amar-e-stoudemire.webp","img/anderson-varejao.webp","img/andre-drummond.webp","img/andre-iguodala.webp","img/andre-miller.webp","img/andrea-bargnani.webp","img/andrei-kirilenko.webp","img/andres-nocioni.webp","img/andrew-bogut.webp","img/andrew-bynum.webp","img/andrew-wiggins.webp","img/andris-biedrins.webp","img/antawn-jamison.webp","img/anthony-bennett.webp","img/anthony-davis.webp","img/anthony-edwards.webp","img/antonio-daniels.webp","img/antonio-mcdyess.webp","img/aron-baynes.webp","img/artis-gilmore.webp","img/arvydas-sabonis.webp","img/ausar-thompson.webp","img/austin-reaves.webp","img/avery-bradley.webp","img/bam-adebayo.webp","img/baron-davis.webp","img/ben-gordon.webp","img/ben-simmons.webp","img/ben-wallace-m.webp","img/ben-wallace.webp","img/bernard-king.webp","img/bill-bradley.webp","img/bill-russell-m.webp","img/bill-russell.webp","img/bismack-biyombo.webp","img/blake-griffin.webp","img/bob-cousy.webp","img/bob-mcadoo.webp","img/bob-pettit.webp","img/boban-marjanovic.webp","img/bobby-portis.webp","img/bogdan-bogdanovic.webp","img/bojan-bogdanovic.webp","img/boris-diaw.webp","img/brad-miller.webp","img/bradley-beal.webp","img/brandon-bass.webp","img/brandon-ingram.webp","img/brandon-jennings.webp","img/brandon-miller.webp","img/brandon-roy.webp","img/brian-scalabrine.webp","img/bronny-james.webp","img/brook-lopez.webp","img/bruce-bowen.webp","img/buddy-hield.webp","img/cade-cunningham.webp","img/cameron-johnson.webp","img/caris-levert.webp","img/carlos-arroyo.webp","img/carlos-boozer.webp","img/carlos-delfino.webp","img/carmelo-anthony-m.webp","img/carmelo-anthony.webp","img/caron-butler.webp","img/cedi-osman.webp","img/chandler-parsons.webp","img/channing-frye.webp","img/charles-barkley-m.webp","img/charles-oakley.webp","img/chauncey-billups-m.webp","img/chauncey-billups.webp","img/chet-holmgren.webp","img/chris-andersen.webp","img/chris-bosh-m.webp","img/chris-bosh.webp","img/chris-kaman.webp","img/chris-mullin.webp","img/chris-paul-m.webp","img/chris-paul.webp","img/chris-webber-m.webp","img/christian-laettner.webp","img/christian-wood.webp","img/chuck-connors.webp","img/cj-mccollum.webp","img/clint-capela.webp","img/clyde-drexler.webp","img/coby-white.webp","img/collin-sexton.webp","img/corey-brewer.webp","img/cory-joseph.webp","img/courtney-lee.webp","img/cuttino-mobley.webp","img/d-angelo-russell.webp","img/d-j-augustin.webp","img/damian-lillard-m.webp","img/damian-lillard.webp","img/dan-majerle.webp","img/daniel-gafford.webp","img/daniel-theis.webp","img/danilo-gallinari.webp","img/danny-granger.webp","img/danny-green.webp","img/dante-exum.webp","img/dario-saric.webp","img/darius-garland.webp","img/darius-miles.webp","img/darius-songaila.webp","img/darko-milicic.webp","img/darren-collison.webp","img/dave-bing.webp","img/dave-cowens.webp","img/david-andersen.webp","img/david-lee.webp","img/david-robinson-m.webp","img/david-robinson.webp","img/david-west.webp","img/davis-bertans.webp","img/deaaron-fox.webp","img/deandre-ayton.webp","img/deandre-jordan.webp","img/demar-derozan.webp","img/demarcus-cousins.webp","img/dennis-rodman.webp","img/dennis-schroder.webp","img/derek-fisher.webp","img/deron-williams.webp","img/derrick-coleman.webp","img/derrick-favors.webp","img/derrick-jones-jr.webp","img/derrick-rose-m.webp","img/derrick-rose.webp","img/derrick-white.webp","img/desmond-bane.webp","img/desmond-mason.webp","img/detlef-schrempf.webp","img/devin-booker-m.webp","img/devin-booker.webp","img/devin-harris.webp","img/devin-vassell.webp","img/dikembe-mutombo-m.webp","img/dikembe-mutombo.webp","img/dino-ra-a.webp","img/dirk-nowitzki-m.webp","img/dirk-nowitzki.webp","img/dolph-schayes.webp","img/domantas-sabonis.webp","img/dominique-wilkins.webp","img/donatas-motiejunas.webp","img/donovan-mitchell.webp","img/donte-divincenzo.webp","img/dorian-finney-smith.webp","img/doug-christie.webp","img/draymond-green.webp","img/drazen-petrovic.webp","img/drew-gooden.webp","img/duncan-robinson.webp","img/dwight-howard-m.webp","img/dwight-howard.webp","img/dwight-powell.webp","img/dwyane-wade-m.webp","img/dwyane-wade.webp","img/dyson-daniels.webp","img/dzanan-musa.webp","img/earl-boykins.webp","img/earl-watson.webp","img/eddie-jones.webp","img/eddy-curry.webp","img/elgin-baylor.webp","img/elton-brand.webp","img/elvin-hayes.webp","img/emeka-okafor.webp","img/enes-kanter-freedom.webp","img/eric-gordon.webp","img/erick-dampier.webp","img/ersan-ilyasova.webp","img/evan-fournier.webp","img/evan-mobley.webp","img/evan-turner.webp","img/fabricio-oberto.webp","img/frank-ntilikina.webp","img/franz-wagner.webp","img/fred-vanvleet.webp","img/gary-payton-ii.webp","img/gary-payton-m.webp","img/gary-payton.webp","img/george-mikan.webp","img/gerald-wallace.webp","img/gheorghe-muresan.webp","img/giannis-antetokounmpo-m.webp","img/giannis-antetokounmpo.webp","img/gilbert-arenas-m.webp","img/gilbert-arenas.webp","img/glen-davis.webp","img/glen-rice.webp","img/goran-dragic.webp","img/gordon-hayward.webp","img/grant-hill-m.webp","img/grant-hill.webp","img/grayson-allen.webp","img/greg-monroe.webp","img/greg-oden.webp","img/hakeem-olajuwon-m.webp","img/hanno-mottola.webp","img/harrison-barnes.webp","img/hasheem-thabeet.webp","img/hassan-whiteside.webp","img/herbert-jones.webp","img/hidayet-turkoglu.webp","img/horace-grant.webp","img/igor-rakocevic.webp","img/iman-shumpert.webp","img/isaiah-thomas.webp","img/ish-smith.webp","img/ivica-zubac.webp","img/j-j-barea.webp","img/j-r-smith.webp","img/ja-morant.webp","img/jaden-mcdaniels.webp","img/jalen-brunson.webp","img/jalen-green.webp","img/jalen-johnson.webp","img/jalen-rose.webp","img/jalen-suggs.webp","img/jalen-williams.webp","img/jamal-crawford.webp","img/jamal-murray.webp","img/jameer-nelson.webp","img/james-harden-m.webp","img/james-harden.webp","img/james-jones.webp","img/james-worthy.webp","img/jan-vesely.webp","img/jared-dudley.webp","img/jaren-jackson-jr.webp","img/jarrett-allen.webp","img/jason-collins.webp","img/jason-kapono.webp","img/jason-kidd-m.webp","img/jason-kidd.webp","img/jason-richardson.webp","img/jason-terry.webp","img/jason-williams.webp","img/javale-mcgee.webp","img/jaylen-brown.webp","img/jayson-tatum.webp","img/jeff-green.webp","img/jeff-hornacek.webp","img/jeff-teague.webp","img/jerami-grant.webp","img/jeremy-lin.webp","img/jermaine-o-neal.webp","img/jerry-lucas.webp","img/jerry-stackhouse.webp","img/jerry-west-m.webp","img/jerry-west.webp","img/jimmer-fredette.webp","img/jimmy-butler.webp","img/jj-redick.webp","img/jo-jo-white.webp","img/joakim-noah.webp","img/joe-dumars.webp","img/joe-ingles.webp","img/joe-johnson.webp","img/joel-anthony.webp","img/joel-embiid.webp","img/john-havlicek.webp","img/john-stockton.webp","img/john-wall.webp","img/jonas-jerebko.webp","img/jonas-valanciunas.webp","img/jonathan-isaac.webp","img/jonathan-kuminga.webp","img/jordan-clarkson.webp","img/jordan-farmar.webp","img/jordan-poole.webp","img/jorge-garbajosa.webp","img/jose-calderon.webp","img/josh-giddey.webp","img/josh-hart.webp","img/josh-howard.webp","img/josh-okogie.webp","img/josh-smith.webp","img/jrue-holiday.webp","img/juan-carlos-navarro.webp","img/juan-hernangomez.webp","img/julius-erving.webp","img/julius-randle.webp","img/jusuf-nurkic.webp","img/juwan-howard.webp","img/karl-anthony-towns.webp","img/karl-malone-m.webp","img/karl-malone.webp","img/kawhi-leonard-m.webp","img/kawhi-leonard.webp","img/kelly-olynyk.webp","img/kelly-oubre-jr.webp","img/kemba-walker.webp","img/kendrick-perkins.webp","img/kenneth-faried.webp","img/kentavious-caldwell-pope.webp","img/kenyon-martin.webp","img/kevin-durant-m.webp","img/kevin-durant.webp","img/kevin-garnett-m.webp","img/kevin-garnett.webp","img/kevin-johnson.webp","img/kevin-love.webp","img/kevin-martin.webp","img/kevin-mchale.webp","img/kevon-looney.webp","img/khris-middleton.webp","img/kirk-hinrich.webp","img/klay-thompson-m.webp","img/klay-thompson.webp","img/kobe-bryant-m.webp","img/kobe-bryant.webp","img/kris-humphries.webp","img/kristaps-porzingis.webp","img/kwame-brown.webp","img/kyle-anderson.webp","img/kyle-korver.webp","img/kyle-kuzma.webp","img/kyle-lowry.webp","img/kyrie-irving-m.webp","img/kyrie-irving.webp","img/lamar-odom.webp","img/lamarcus-aldridge.webp","img/lamelo-ball.webp","img/lance-stephenson.webp","img/larry-bird-m.webp","img/larry-bird.webp","img/larry-hughes.webp","img/larry-johnson.webp","img/larry-nance-jr.webp","img/lauri-markkanen.webp","img/leandro-barbosa.webp","img/lebron-james-m.webp","img/lebron-james.webp","img/lonzo-ball.webp","img/lou-williams.webp","img/luguentz-dort.webp","img/luis-scola.webp","img/luka-doncic-m.webp","img/luka-doncic.webp","img/luke-kennard.webp","img/luke-walton.webp","img/luol-deng.webp","img/magic-johnson-m.webp","img/mahmoud-abdul-rauf.webp","img/malcolm-brogdon.webp","img/malik-monk.webp","img/manu-ginobili-m.webp","img/manu-ginobili.webp","img/marc-gasol.webp","img/marcin-gortat.webp","img/marco-belinelli.webp","img/marcus-camby.webp","img/marcus-smart.webp","img/mario-chalmers.webp","img/mario-hezonja.webp","img/mark-eaton.webp","img/marvin-bagley-iii.webp","img/matisse-thybulle.webp","img/matt-barnes.webp","img/matthew-dellavedova.webp","img/max-strus.webp","img/mehmet-okur.webp","img/metta-sandiford-artest.webp","img/michael-beasley.webp","img/michael-jordan-m.webp","img/michael-porter-jr.webp","img/michael-redd.webp","img/mickael-pietrus.webp","img/mikal-bridges.webp","img/mike-bibby.webp","img/mike-conley-jr.webp","img/mike-miller.webp","img/miles-bridges.webp","img/milos-teodosic.webp","img/mitch-richmond.webp","img/mitchell-robinson.webp","img/mo-williams.webp","img/monta-ellis.webp","img/moritz-wagner.webp","img/moses-malone.webp","img/myles-turner.webp","img/nando-de-colo.webp","img/nate-robinson.webp","img/nate-thurmond.webp","img/naz-reid.webp","img/nemanja-nedovic.webp","img/nenad-krstic.webp","img/nene.webp","img/nick-calathes.webp","img/nick-van-exel.webp","img/nick-young.webp","img/nicolas-batum.webp","img/nikola-jokic-m.webp","img/nikola-jokic.webp","img/nikola-mirotic.webp","img/nikola-pekovic.webp","img/nikola-vucevic.webp","img/norman-powell.webp","img/og-anunoby.webp","img/omer-as-k.webp","img/onyeka-okongwu.webp","img/oscar-robertson-m.webp","img/oscar-robertson.webp","img/otis-thorpe.webp","img/pablo-prigioni.webp","img/paolo-banchero.webp","img/pascal-siakam.webp","img/pat-connaughton.webp","img/patrick-beverley.webp","img/patrick-ewing-m.webp","img/patrick-ewing.webp","img/patty-mills.webp","img/pau-gasol-m.webp","img/pau-gasol.webp","img/paul-arizin.webp","img/paul-george.webp","img/paul-millsap.webp","img/paul-pierce-m.webp","img/paul-pierce.webp","img/payton-pritchard.webp","img/peja-stojakovic.webp","img/penny-hardaway-m.webp","img/penny-hardaway.webp","img/pero-antic.webp","img/pete-maravich.webp","img/predrag-danilovic.webp","img/raja-bell.webp","img/rajon-rondo.webp","img/rashard-lewis.webp","img/rasheed-wallace.webp","img/rasho-nesterovic.webp","img/raul-lopez.webp","img/ray-allen-m.webp","img/ray-allen.webp","img/raymond-felton.webp","img/reggie-jackson.webp","img/reggie-miller-m.webp","img/reggie-miller.webp","img/richard-hamilton.webp","img/richard-jefferson.webp","img/rick-barry.webp","img/rick-fox.webp","img/ricky-davis.webp","img/ricky-rubio.webp","img/rik-smits.webp","img/rj-barrett.webp","img/robert-archibald.webp","img/robert-horry.webp","img/robert-parish.webp","img/robert-williams-iii.webp","img/robin-lopez.webp","img/rodrigue-beaubois.webp","img/ronny-turiaf.webp","img/rudy-fernandez.webp","img/rudy-gay.webp","img/rudy-gobert.webp","img/rui-hachimura.webp","img/russell-westbrook-m.webp","img/russell-westbrook.webp","img/ryan-anderson.webp","img/sam-cassell.webp","img/sam-jones.webp","img/samuel-dalembert.webp","img/sarunas-jasikevicius.webp","img/sasha-kaun.webp","img/sasha-vujacic.webp","img/scoot-henderson.webp","img/scottie-barnes.webp","img/scottie-pippen-m.webp","img/semih-erden.webp","img/serge-ibaka.webp","img/sergei-monia.webp","img/sergey-karasev.webp","img/sergio-rodriguez.webp","img/seth-curry.webp","img/shai-gilgeous-alexander-m.webp","img/shai-gilgeous-alexander.webp","img/shane-battier.webp","img/shaquille-o-neal-m.webp","img/shaquille-o-neal.webp","img/shareef-abdur-rahim.webp","img/shaun-livingston.webp","img/shawn-bradley.webp","img/shawn-kemp-m.webp","img/shawn-marion-m.webp","img/shawn-marion.webp","img/spud-webb.webp","img/stephen-curry-m.webp","img/stephen-curry.webp","img/stephen-jackson.webp","img/stephon-marbury.webp","img/steve-francis.webp","img/steve-kerr.webp","img/steve-nash-m.webp","img/steve-nash.webp","img/steve-smith.webp","img/steven-adams.webp","img/sviatoslav-mykhailiuk.webp","img/t-j-mcconnell.webp","img/taj-gibson.webp","img/tayshaun-prince.webp","img/terry-rozier.webp","img/thabo-sefolosha.webp","img/thaddeus-young.webp","img/tiago-splitter.webp","img/tim-duncan-m.webp","img/tim-duncan.webp","img/tim-hardaway-jr.webp","img/tim-hardaway.webp","img/timofey-mozgov.webp","img/tobias-harris.webp","img/tomas-satoransky.webp","img/toni-kukoc.webp","img/tony-allen.webp","img/tony-parker-m.webp","img/tony-parker.webp","img/tornike-shengelia.webp","img/tracy-mcgrady-m.webp","img/tracy-mcgrady-x.webp","img/tracy-mcgrady.webp","img/trae-young.webp","img/trevor-ariza.webp","img/tristan-thompson.webp","img/troy-murphy.webp","img/ty-lawson.webp","img/tyler-herro.webp","img/tyreke-evans.webp","img/tyrese-haliburton.webp","img/tyrese-maxey.webp","img/tyronn-lue.webp","img/tyson-chandler.webp","img/tyus-jones.webp","img/udonis-haslem.webp","img/vassilis-spanoulis.webp","img/victor-claver.webp","img/victor-oladipo.webp","img/victor-wembanyama.webp","img/viktor-khryapa.webp","img/vince-carter-m.webp","img/vince-carter.webp","img/vlade-divac.webp","img/vladimir-radmanovic.webp","img/walt-bellamy.webp","img/walt-frazier.webp","img/walter-herrmann.webp","img/wang-zhizhi.webp","img/wendell-carter-jr.webp","img/wes-unseld.webp","img/willis-reed-m.webp","img/willis-reed.webp","img/willy-hernangomez.webp","img/wilt-chamberlain-m.webp","img/wilt-chamberlain.webp","img/yao-ming-m.webp","img/yao-ming.webp","img/yi-jianlian.webp","img/zach-edey.webp","img/zach-lavine.webp","img/zach-randolph.webp","img/zaza-pachulia.webp","img/zion-williamson.webp","img/zoran-dragic.webp","img/zoran-planinic.webp","img/zydrunas-ilgauskas.webp"];

/* -------------------------------------------------------------
   安装：把所有资源抓进缓存
   ------------------------------------------------------------- */
self.addEventListener('install', (ev) => {
  ev.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let done = 0;
    /* 逐个抓，并且**容错**：某一张图失败不能让整个安装失败，
       否则 iOS 上会因为一次网络抖动就永远装不上。 */
    await Promise.all(ASSETS.map(async (url) => {
      try {
        /* 关键：必须用 cache:'reload' ——
           否则浏览器可能拿 HTTP 缓存里的旧副本，装出来的 SW 是旧的。 */
        const res = await fetch(url, { cache: 'reload' });
        if (res && (res.ok || res.type === 'opaque')) await cache.put(url, res);
      } catch (e) { /* 忽略单张失败 */ }
      done++;
      /* 通知页面更新进度条（有页面在用才发） */
      if (done % 20 === 0 || done === ASSETS.length) {
        const list = await self.clients.matchAll();
        list.forEach((c) => c.postMessage({ type: 'sw-progress', done, total: ASSETS.length }));
      }
    }));
    /* 立刻接管，不用等用户关掉所有标签页 */
    await self.skipWaiting();
  })());
});

/* 激活：清掉旧版本缓存 */
self.addEventListener('activate', (ev) => {
  ev.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith('peak-card-') && k !== CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* -------------------------------------------------------------
   取用：缓存优先
   -------------------------------------------------------------
   ① 缓存里有 → 直接返回（离线也能开）
   ② 缓存里没有 → 联网拿，顺手存进缓存（比如以后新增的图）
   ③ 联网也失败 → 如果是页面导航，退回缓存的 index.html
   ============================================================= */
self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 只管自己域下的

  ev.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      /* 离线且没缓存：页面导航就退回首页，其它返回 504 */
      if (req.mode === 'navigate') {
        const idx = await cache.match('index.html') || await cache.match('./');
        if (idx) return idx;
      }
      return new Response('离线且无缓存', { status: 504, statusText: 'Offline' });
    }
  })());
});

/* 页面可以主动问"装好了没 / 装了多少" */
self.addEventListener('message', (ev) => {
  if (!ev.data || ev.data.type !== 'sw-status') return;
  ev.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const keys = await cache.keys();
    ev.source && ev.source.postMessage({
      type: 'sw-status', version: VERSION,
      cached: keys.length, total: ASSETS.length,
      ready: keys.length >= ASSETS.length,
    });
  })());
});
