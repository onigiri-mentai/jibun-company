'use strict';
// Single persistence boundary. A native wrapper can supply the same get/set interface.
window.CompanyStorage={key:'jibun-company-v1',read(){try{return JSON.parse(localStorage.getItem(this.key));}catch{return null;}},write(data){localStorage.setItem(this.key,JSON.stringify(data));},export(data){return JSON.stringify({format:'jibun-company',version:1,data},null,2);}};
