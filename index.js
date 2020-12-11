const nodemailer = require('nodemailer');
const schedule = require('node-schedule')
const axios = require('axios').default;
const config = require('./config');
let rule = new schedule.RecurrenceRule();

rule.dayOfWeek = [5]

rule.hour = 15;
rule.minute = 12;
rule.second = 0;
const transporter = nodemailer.createTransport({
    service: 'QQ',
    port: 465,
    secureConnection: true,
    auth: {
        user: config.user,
        // 非qq密码，而是设置的smtp密码
        pass: config.pass
    }
});
const mailOptions = {
    from: config.from,
    to: config.to,
    subject: '每周掘金热门',
    html: ''
}
function requstData() {
    let url = "https://api.juejin.cn/recommend_api/v1/article/recommend_cate_feed";
    let options = {
        sort_type: 7,
        limit: 200,
        id_type: 2,
        cate_id: '6809637767543259144',
        cursor: '0'
    }
    const baseUrl = "https://juejin.cn/post/"
    return axios.post(url, options).then(({data}) => {
        // console.log(data.data)
        let result = data.data.filter((article) => article.article_info.digg_count > 300);
        // mailOptions.h
        let html = '';
        for(var i = 0; i < result.length; i++) {
            let article = result[i];
            html += `<a href="${baseUrl + article.article_info.article_id}">${article.article_info.title}</a> ${article.article_info.digg_count}赞</br>`
        }
        console.log(html)
        // mailOptions.html = html
        return html;
    })
}
let job = schedule.scheduleJob(rule, () => {
    requstData().then((res) => {
        mailOptions.html = res;
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: ' + JSON.stringify(info))
        })
    })
})
