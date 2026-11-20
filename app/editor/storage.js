/* 저장 — 브라우저(IndexedDB) 자동 저장과 작업 파일(.json) 형식 · 버전 변환
   작업 파일 형식을 바꿀 때: FORMAT 을 올리고 migrate() 에 이전 버전 변환을 추가합니다. */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';
  var FORMAT = 1; // 작업 파일 형식 버전

  var DB = {
    open: function () { return new Promise(function (res, rej) { try { var r = indexedDB.open('kz-editor', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; } catch (e) { rej(e); } }); },
    get: function (k) { return this.open().then(function (db) { return new Promise(function (res, rej) { var q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); }; }); }); },
    set: function (k, v) { return this.open().then(function (db) { return new Promise(function (res, rej) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = function () { res(); }; tx.onerror = function () { rej(tx.error); }; }); }); },
    del: function (k) { return this.open().then(function (db) { return new Promise(function (res) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); }); }
  };

  // 저장 형식: { kind:'kz-editor', v:FORMAT, app:버전, at:시각, S:사이트 설정, gjs:GrapesJS 프로젝트 }
  function pack(S, gjs) { return { kind: 'kz-editor', v: FORMAT, app: KZ.VERSION, at: Date.now(), S: S, gjs: gjs }; }
  function migrate(d) {
    if (!d || !d.gjs) throw new Error('작업 파일이 아닙니다');
    if (!d.kind) d.kind = 'kz-editor';           // 0.1 시제품 브라우저 저장본
    if (d.kind !== 'kz-editor') throw new Error('작업 파일이 아닙니다');
    if (!d.v) d.v = 1;
    if (d.v > FORMAT) throw new Error('더 새 버전의 편집기에서 만든 파일입니다. 편집기를 새로고침해 보세요.');
    // 예: if (d.v === 1) { …형식 변환…; d.v = 2; }
    return d;
  }
  KZ.store = { DB: DB, FORMAT: FORMAT, pack: pack, migrate: migrate };
})(window.KZ);
