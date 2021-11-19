/**
更新时间：2020-10-12 20:05
 1.根据原版脚本修改，增加上月账单信息，需要重获取Cookie，打开app脚本
 2. 畅享套餐使用，其他套餐，自行测试，模仿测试 
 3.可能因地区不同，脚本特别适用
 由 Macsuny 修改
 感谢原版作者提供剧本
 * 下载安装天翼账号中心登陆获取authToken

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#quantumultx
 [rewrite_local]
 ^https?:\/\/e\.189\.cn\/store\/user\/package_detail\.do url script-request-header teleInfinity.js
 # MITM = e.189.cn
 [task_local]
 10 8 * * * 电信无限.js

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# [龙]
cron "04 00 * * *" 脚本路径=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/telecomInfinity.js, enabled=true, tag=电信套餐查询

http-request ^https?:\/\/e\.189\.cn\/store\/user\/package_detail\.do script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/任务/telecomInfinity.js

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 
# 浪涌 4.0 :
[脚本]
电信套餐查询 = type=cron,cronexp=35 5 0 * * *,script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/telecomInfinity.js,script-update-interval=0

电信套餐查询 = script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/telecomInfinity.js,type=http-request,pattern=https?:\/\/e\.189\ .cn\/store\/user\/package_detail\.do

~~~~~~~~~~~~~~~~~~~~~~~~
 # 中间人
主机名 = e.189.cn

 */
// 配置信息
让配置 = {
    name: "中国电信世界触手可及🤝",
    authTokenKey: "china_telecom_authToken_10000",
    CookieKey: "china_telecom_cookie",
    delay:0, //自定义延迟到,单位毫秒,(如填200则延迟0.2秒执行),默认无延迟
    info: 1, //是否显示手机归属地，1为显示，0为不显示
}
让 $ = new Env(config.name),
     Y = $.getdata('Mon').slice(0,4)||$.time('yyyy'),
     M = $.getdata('Mon').slice(-2)||$.time('MM') ; //查询前发生，可以')'号后减几
     const 通知 = $.isNode() ？要求('./sendNotify') : '';
   让 AUTHTOKEN = $.getdata(config.authTokenKey)
   让 COOKIE = $.getdata(config.CookieKey)
无功请求 = {
    细节： {
        url: "https://e.189.cn/store/user/package_detail.do",
        标题：{
            “authToken”：AUTHTOKEN，
            "type": "alipayMiniApp"
        },
        身体：“t = tysuit”，
        方法：“POST”
    },
    平衡： {
        url: "https://e.189.cn/store/user/balance_new.do",
        标题：{
            “authToken”：AUTHTOKEN，
            "type": "alipayMiniApp",
            “用户代理”：“TYUserCenter/2.8（iPhone；iOS 14.0；规模/3.00）”
        },
        身体：“t = tysuit”，
        方法：“POST”
    },
    信息：{
        url: "https://e.189.cn/store/user/getExtInfo.do",
        标题：{
            “authToken”：AUTHTOKEN，
            "type": "alipayMiniApp",
           // "曲奇": 曲奇
        },
        方法：“获取”
    },
      账单： {
        网址：`https://e.189.cn/store/user/bill.do?year=${Y}&month=${M}&t=tysuit`，
        标题：{
            “曲奇”：曲奇
        },
        方法：“获取”
    }
}

if (isGetCookie = typeof $request !== 'undefined') {
    获取Cookie()
    $.done()
} 别的 {
 !(异步() => {
  等待 cron()
  if($.isNode()){
       await notify.sendNotify(config.name,subtitle+"\n"+message)
    }
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())
}
函数 GetCookie() {
    如果（$request && $request.headers）{
        var cookieVal = $request.headers['authToken']
        var COOKIE = $request.headers['Cookie']
      $.setdata(COOKIE, config.CookieKey)
        如果（cookieVal）{
            如果 ($.setdata(cookieVal, config.authTokenKey)) {
                $.msg(config.name, '获取authToken: 成功', '')
              // console.log(`[${config.name}] 获取authToken: 成功, authToken: ${cookieVal}, Cookie: [${COOKIE}]` )
            }
        }
    }
}

异步函数 cron() {
    如果 (!AUTHTOKEN) {
        $.msg(config.name, "请获取authToken", "下载安装APP[天翼账号中心]获取")
        返回
    }
    让细节 = 等待 httpRequest(requests.detail, config.delay)
    让余额 = 等待 httpRequest(requests.balance, config.delay)
    让账单 = 等待 httpRequest(requests.bill, config.delay)
    变量信息 = {}
    如果（配置信息）{
        信息 = 等待 httpRequest(requests.info, config.delay)
    }
    等待解析数据（详细信息，余额，信息，账单）
}

异步函数 httpRequest(resq, delay = 0, statusCode = 200) {
    返回新的承诺（解决 => {
      setTimeout(() => {
            var adapterClient = $.get;
            如果（typeof resq.method ！=“未定义”）{
                如果（resq.method ==“POST”）{
                    适配器客户端 = $.post
                }
                如果（resq.method ==“GET”）{
                    适配器客户端 = $.GET
                }
                删除请求方法
            }
          $.post(resq, function (error, response, body) {
                尝试 {
                    如果（！错误）{
                        if (typeof response.statusCode == "undefined" || response.statusCode == statusCode) {
解析(JSON.parse(body));
                        }
                    } 别的 {
                        $.msg('', 'httpRequest', 错误)
                        解决（””）
                    }
                }赶上（e）{
                    $.msg('', 'httpRequest catch', e)
                    解决（””）
                }
            });
     }, parseInt(delay))
    })
}

功能解析数据（细节，余额，信息，账单）{
    返回新的承诺（异步（解决）=> {
        if (!info || !detail || !balance|| !bill) {
            解决（“完成”）
            返回
        }
        如果（余额。结果！= 0）{
            $.msg(config.name, "获取余额信息失败", `${balance.msg}`)
            解决（“完成”）
            返回
        }
        if (config.info && info.result != 10000) {
            $.msg(config.name, "", "获取手机号归属地信息失败，请稍后重试")
            解决（“完成”）
            返回
        }
        如果 (bill.paraFieldResult !=null){
            bill = `无`
            解决（“完成”）
            //返回
        }
        等待 showmsg（详细信息，余额，信息，账单）
        解决（“完成”）
    })
}

功能showmsg（数据，余额，exdata，bldata）{
    返回新的承诺（（解决）=> {
        let productname = "中国电信",
            voiceAmount = " ",
            voiceUsage = " ",
            语音平衡 = " ",
            msgUsage = "",
            msgBalance = "",
            msgAmount = "",
            useddCommon、balanceCommon、totalCommon、消息；
        //console.log(data) //套餐信息
        尝试 {
            var 副标题 = ""
            如果（配置信息）{
                副标题 = "【手机】" + exdata.mobileShort + "(" + exdata.province + "-" + exdata.city + ")"
            } //手机号码
            for (i = 0; i < data.items.length; i++) {
                for (k = 0; k < data.items[i].items.length; k++) {
                    让 item = data.items[i].items[k]
                    if (data.items[i].offerType == '11' || data.items[i].offerType == '21') {
                        productname = data.items[i].productOFFName
                    } 别的 {
                        productname = data.items[0].productOFFName
                    }
                    message = "【套餐】" + productname; //主套餐名称
                    if (item.nameType == '401100' || item.nameType == '431100') {
                        msgUsage = item.usageAmount,
                            msgAmount = item.ratableAmount,
                            msgBalance = item.balanceAmount
                    }
                    如果（msgUsage）{
                        msg = "【短信】已用：" + msgsage + "条消费：" + msgBalance + "条消费：" + msgAmount + "条",
                            消息 += "\n" + msginfo
                    }; //幽默余量
                    让 VoiceArr = data.items[i].items;
                    如果（item.nameType == '131100'）{
                        for (VoiceArr 的语音词)
                            voiceAmount = Voiceiterm.ratableAmount,
                            voiceBalance = Voiceiterm.balanceAmount,
                            voiceUsage = Voiceiterm.usageAmount
                    }
                    voice = "【通话】已用：" + voiceUsage + "分钟声音：" + voiceBalance + "分钟计费：" + voiceAmount + "分钟";
                    消息 += "\n" + 语音；//语音

                    if (item.nameType == "331101") {
                        useddCommon = formatFlow(item.usageAmount / 1024),
                            balanceCommon = item.ratableResourcename,
                            totalCommon = data.items[i].productOFFName
                    } //畅享套餐
                    否则如果（item.nameType ==“331100”）{
                        useddCommon = formatFlow(item.usageAmount / 1024),
                            balanceCommon = formatFlow(item.balanceAmount / 1024),
                            totalCommon = formatFlow(item.ratableAmount / 1024)
                    }; //套餐
                    如果（使用通用）{
                        flow = "【流量】已用: "+ useddCommon + "usualdCommon:" + balanceCommon + " 费用负担:" + totalCommon,
                            消息 += "\n" + 流量
                    }
                }
            }
        } 抓住（错误）{
            console.log("+ err + '\n套餐响应数据：' + JSON.stringify(data) + '\n输入以上数据机主姓名删除后反馈给作者')
        }; //以上为工具用途

        //console.log(balance) //话费余额
        message += "\n" + "【话费】:" + (parseInt(balance.totalBalanceAvailable) / 100).toFixed(2) + "元";
        //console.log(bldata.items) //账单信息
        尝试 {
            如果（bldata ！= '无'）{
                message += ` ${M}月消费支出：` + bldata.items[0].sumCharge / 100 + '元'
            };
            如果（bldata == '无'）{
                消息 = 消息 + "\n" + `【$ {
      米
    }月账单】` + bldata
            } else if (typeof bldata.items[0].acctName != "undefined" && bldata.serviceResultCode == 0) {
                billcharge = bldata.items[0].items;
                bills = `【${M}月话费账单】` + "\n " + billcharge[1].chargetypeName + ':' + billcharge[1].charge / 100 + '元' + "\n " + billcharge[ 2].chargetypeName + ':' + billcharge[2].charge / 100 + '元' + "\n " + billcharge[0].chargetypeName + ':' + billcharge[0].charge / 100 + '元' ,
                    消息 = 消息 + "\n" + 账单
            }; //账单明细
            $.msg(config.name, 副标题, 消息)
        } 抓住（错误）{
            console.log("查询错误，错误原因:" + err + '\n账单响应数据:' + JSON.stringify(bldata) + '\n删除后上传数据机主姓名')
        }
        解决（“完成”）
    })
}
// MB 和 GB 自动转换
函数格式流（数字）{
    如果（数字 < 1024）{
        返回 number.toFixed(2) + "MB"
    }
    return (number / 1024).toFixed(2) + "GB"
}

函数 Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t ;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r) =>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call( this.env,t,"POST")}}返回新类{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile=" box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object. assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){ return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t ,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{ s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1} }getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this. getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a= {url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr (t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path? this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs。 existsSync(t),i=!s&&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync (i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this .path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile) ,s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?这个.fs。writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1 ").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t ,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g) ||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s ]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)} getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*? )$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i ,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[, i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null :o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify) (o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t): this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null }setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this. isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t) {this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this .ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"] ,删除 t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&&this.isNeedRewrite&&&(t.headers=t.headers||{},Object .assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i, s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t. opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null, {status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got( t).on("重定向",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this .logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers :r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=( ()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t. headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this .isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s] (t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method=s ,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{ statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e( t));else if(this.isNode()){this.initGotEnv(t);const{url:i,...r}=t;this.got[s](i,r).then(t =>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)}, t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e) :new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(), "s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length))) ;for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e] :("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r) {const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t} :this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t ["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t[" open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s} }如果这。isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge() ||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this. isMuteLog){let t=["","==============📣系统通知📣============"];t.push( e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(.. .t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){ const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack) :this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={} ){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束！🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
