# Upload v2 - React + TypeScript + Vite

## Development

- use pnpm
- use node.js v20
- use prettier

# Prompt to Sonet 3.5

Read the following Node.js program, create a React application using TypeScript, such that,
the application has these fields for user to input:

title - string, required fields;
url - string, required fields;
dateHappened - datetime in UTC timezone in format like '2024-10-31T12:26:23.000Z';
content - an textarea that is expandable and no longer than 30 rows of line, scroll is shown when text exist;
autoTags - a string, that contains tags separated by comma;
quckComment - is textarea that is expandable and no longer than 30 rows of line, scroll is shown when text exist;

There is a submit button to trigger function submit() to start a HTTP request for recording new entry via API strapi_endpoint_create.$

Show a popup toast to indicate the response from the API is sucess by check response code is equal to 200.

The API call may take longer than 60 seconds, wait the API's response for 120 seconds.

If API call is timeout, wait for 10 seconds and then retry. Repeat retry for maximum 3 times.

The Node.js program code:

```js
const STRAPI_BASEURL = proces.env.STRAPI_BASEURL;
const strapi_endpoint_create = `${STRAPI_BASEURL}/api/newstreams`;
const STRAPI_TOKEN = proces.env.STRAPI_TOKEN;


let title = '用一個清潔公司老闆的故事告訴你：股票市場到底是如何運作的？';
let url = 'https://kopu.chat/how-stock-market-work/';
let dateHappened = (new Date()).toISOString();
let content = `本集是財經知識介紹的第一彈——超入門股票名詞解釋。讓我們來探討一下：你有沒有想過，你手上的那張股票是怎麼來的？企業發行股票的目的是什麼？股票要去哪裡買跟賣？怎麼看一支股票適不適合買？投資銀行聽起來很厲害但到底在做什麼？`;
let autoTags = `finance, investment`;
let quckComment = ``;

function submit(
    title,
    url,
    dateHappened,
    content,
    autoTags,
    quckComment
) {
    let data = {
    "data": {
        "title": title,
        "url": `${url}`,
        "dateHappened": dateHappened,
        "content": [
            {
                "type": "paragraph",
                "children": [
                    {
                        "text": content,
                        "type": "text"
                    }
                ]
            }
        ],
        "meta": {
            "quckTag": ["__test", "__hand_input", autoTags].join(', '),
            "quckComment": quckComment
        },
        "public": false,
        "createdAt": (new Date()).toISOString(),
        "updatedAt": (new Date()).toISOString(),
        "publishedAt": (new Date()).toISOString(),
        "locale": "zh-Hant-HK"
    }
    }

    if (title.length && url.length) {
    const response = await fetch(strapi_endpoint_create, {
        method: 'post',
        body: JSON.stringify(data),
        headers: {
        // 'Content-Type': 'multipart/form-data'
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        },
    });

    console.log(await response.json());
    } else {
    console.log('No title or url yet!');
    }
}
```
