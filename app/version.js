/* 편집기 버전 — 이 파일 한 곳에만 적습니다. 배포할 때만 올리고, CHANGELOG.md 도 함께 고칩니다.
   (index.html 의 ?v= 캐시 번호는 tools/stamp_version.py 가 이 값으로 맞춥니다 — Actions 가 자동으로) */
window.KZ = window.KZ || {};
KZ.VERSION = '0.17.4';
document.addEventListener('DOMContentLoaded', function () { var v = document.getElementById('ver'); if (v) v.textContent = 'v' + KZ.VERSION; });
