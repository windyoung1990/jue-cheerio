const nodemailer = require('nodemailer');
const schedule = require('node-schedule')
const axios = require('axios').default;
const config = require('./config');
const cheerio = require('cheerio')
let rule = new schedule.RecurrenceRule();

rule.dayOfWeek = [5]

rule.hour = 17;
rule.minute = 0;
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
function requstJuejinData() {
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
        let html = '<h3>掘金热门</h3>';
        for(var i = 0; i < result.length; i++) {
            let article = result[i];
            html += `<a href="${baseUrl + article.article_info.article_id}">${article.article_info.title}</a> ${article.article_info.digg_count}赞</br>`
        }
        console.log(html)
        // mailOptions.html = html
        return Promise.resolve(html);
    })
}
function requestGithubData() {
    let url = 'https://github.com/explore';
    let baseUrl = "https://github.com/";
    return axios.get(url).then((res) => {
        let html = '<h3>github explore</h3>';
        const $ = cheerio.load(res.data)
        $('.social-count').each(function(i)  {
            const text = $(this).text();
            let star = text;
            if (text.indexOf('k') > -1) {
                star = text.replace(/k/ig, '') * 1000;
            }
            if (star > 500) {
                const shortUrl =$(this).parents('article').find('a.text-bold').attr('href');
                if (!shortUrl) {
                    // continue;return
                    return;
                }
                const url = baseUrl + shortUrl;
                const content = shortUrl.slice(1)
                html += `<a href="${url}">${content}</a> ${text}赞</br>`;
                // console.log(html)
            }
        })
        // console.log(html)
        return Promise.resolve(html);
    })

}
// requestGithubData();
let job = schedule.scheduleJob(rule, () => {
    Promise.all([requestGithubData(),requstJuejinData()]).then((values) => {
        mailOptions.html = values.join('');
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: ' + JSON.stringify(info))
        })
    })
})
Promise.all([requestGithubData(),requstJuejinData()]).then((values) => {
})
