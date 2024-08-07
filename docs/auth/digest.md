---
title: Digest
comments: true
tags:
  - Digest
  - 认证
---

## 1. 获取参数

### 1.1. 参数介绍

---

计算最终的 `Digest` 需要以下参数（ `authInfo` 内的）：

```js
const authInfo = {
  username: "admin", // 用户名
  password: "hhll^124", // 密码
  realm: "9ee3667be2d1d1dbe08d7486", // realm
  nonce: "67d46a542c07b990:9ee3667be2d1d1dbe08d7486:191223d7ff6:20b", // 服务器随机数
  algorithm: "MD5", // 算法
  qop: "auth", // 保护质量
  opaque: "799d5", // 不透明
  method: "GET", // 方法
  uri: "", // URI
  nc: "00000001", // 客户端请求计数
  cnonce: "", // 客户端随机数
};
```

### 1.2. 获取并存储参数

---

进入应用时调用后台接口，获取计算 `Digest` 所需的服务器参数，并通过 `Vuex` 存储起来，供所有页面使用。

在 `App.vue` 中实现如下：

```js{15,32}
// App.vue

import { mapActions } from "vuex";
import { getAuthInfo } from "@/api/common";

export default {
  mounted() {
    this.getAuthParams();
  },
  methods: {
    ...mapActions(["setAuthInfo"]),

    async getAuthParams() {
      // 获取参数
      const { data } = await getAuthInfo();
      const { username, password, realm, nonce, algorithm, qop, opaque } = data;
      const transPassword = this.AESDecrypt(password);
      const authInfo = {
        username,
        password: transPassword,
        realm,
        nonce,
        algorithm,
        qop,
        opaque,
        method: "GET",
        uri: "",
        nc: "00000001",
        cnonce: "",
      };
      // 通过Vuex存储起来
      this.setAuthInfo(authInfo);
    },
  },
};
```

### 1.3. 解密密码

---

由于密码不能明文传输，所以需要对后台返回的密码进行解密处理，才能用于计算 `Digest`。

安装 `CryptoJS`，用于加密、解密：

```sh
npm install  crypto-js --save
```

项目中用到的是 `AES` 解密，其中，**秘钥**、**偏移量**、**模式** 需要前后端协商一致。

```js
// App.vue

import CryptoJS from "crypto-js";
const KEY = "1234567890123456"; // 秘钥
const IV = "1234560987645321"; // 偏移量

export default {
  methods: {
    // 解密
    AESDecrypt(data) {
      const key = CryptoJS.enc.Utf8.parse(KEY);
      const iv = CryptoJS.enc.Utf8.parse(IV);
      const decrypt = CryptoJS.AES.decrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
      return decryptedStr.toString();
    },
    // 加密
    AESEncrypt(data) {
      const key = CryptoJS.enc.Utf8.parse(KEY);
      const iv = CryptoJS.enc.Utf8.parse(IV);
      const encrypt = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return encrypt.toString();
    },
  },
};
```

## 2. 计算 Digest

### 2.1. 生成 cnonce

---

随机数固定容易被破解，因此每次请求时客户端生成一个新的随机数。

模板可自行定义，这里为包含数字和字母的 `32` 位字符串:

```js
export default {
  methods: {
    getCnonce() {
      let cnonce = "";
      const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < 32; i++) {
        cnonce += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return cnonce;
    },
  },
};
```

### 2.2. 生成 response

---

由于后台指定的加密方法是 `MD5`，因此，采用 `MD5` 来生成 `response` ：

```js
import CryptoJS from "crypto-js";
export default {
  methods: {
    getResponse(params) {
      const { username, realm, password, method, uri, nonce, nc, cnonce, qop } =
        params;
      const ha1 = CryptoJS.MD5(username + ":" + realm + ":" + password);
      const ha2 = CryptoJS.MD5(method + ":" + uri);
      const response = CryptoJS.MD5(
        ha1 + ":" + nonce + ":" + nc + ":" + cnonce + ":" + qop + ":" + ha2,
      );
      return response.toString();
    },
  },
};
```

### 2.3. 生成 Digest

---

- 生成客户端随机数 `cnonce`
- 通过后台返回的参数、`cnonce` 、 `uri` ，生成 `responce`
- 通过后台返回的参数、`cnonce` 、 `uri` 、 `responce` ，生成 `Digest`

```js{12,19,26}
import { mapState } from "vuex";
const uri =
  "/ngx/proxy?i=aHR0cDovLzEwLjE3LjY4LjE2ODo4MC9waWN0dXJlL1N0cmVhbWluZy90cmFja3MvMjAzLz9uYW1lPWNoMDAwMDJfMDEwMDJmNDAwMTZkYmNiODUwMDAyNTcyZjAwMDI3NzczMDEwNTAyZjExYjc4MjkzMTQwMCZzaXplPTE1MzM5MQ==";

export default {
  computed: {
    ...mapState(["authInfo"]),
  },
  methods: {
    getDigest() {
      // 生成 cnonce
      const cnonce = this.getCnonce();
      const params = {
        ...this.authInfo,
        cnonce,
        uri,
      };
      // 生成 response
      const response = this.getResponse(params);
      const { password, method, ...res } = params;
      const digest = {
        ...res,
        response,
      };
      // 生成 Digest
      const digestStr =
        "Digest " +
        Object.keys(digest)
          .map((key) => `${key}="${digest[key]}"`)
          .join(",");
      return digestStr;
    },
  },
};
```

## 3. 请求图片添加 Digest 认证

### 3.1. XMLHttpRequest 请求

---

图片认证需要将 `Digest` 添加到请求头中的 `Authorization` 键中。

::: warning
由于 `HTML` 中的 `<img>` 标签在获取、下载图片时是浏览器内部完成的，没有走前端封装好的 `axios` 请求，故无法在 `axios` 请求中添加请求头。
:::

因此，采用原生的 `XMLHttpRequest` 来实现图片请求:

```js{12}
const uri =
  "/ngx/proxy?i=aHR0cDovLzEwLjE3LjY4LjE2ODo4MC9waWN0dXJlL1N0cmVhbWluZy90cmFja3MvMjAzLz9uYW1lPWNoMDAwMDJfMDEwMDJmNDAwMTZkYmNiODUwMDAyNTcyZjAwMDI3NzczMDEwNTAyZjExYjc4MjkzMTQwMCZzaXplPTE1MzM5MQ==";

export default {
  methods: {
    getImg() {
      const digestStr = this.getDigest();
      const img = this.$refs.authImg;
      const request = new XMLHttpRequest();
      request.responseType = "blob";
      request.open("get", uri, true);
      request.setRequestHeader("Authorization", digestStr);
      request.onreadystatechange = (e) => {
        if (
          request.readyState === XMLHttpRequest.DONE &&
          request.status === 200
        ) {
          img.src = URL.createObjectURL(request.response);
          img.onload = () => {
            URL.revokeObjectURL(img.src);
          };
        }
      };
      request.send(null);
    },
  },
};
```

### 3.2. 认证成功

---

从下图可以看出，图片是通过 `XMLHttpRequest` 请求获取的，并且请求头中 `Authorization`的值就是前面计算出来的 `Digest`。

> 浏览器原本实现的是在 `图片` 栏，而此时是在 `Fetch/XHR` 栏。

![截图](/images/screenshot/auth/digest/authImg1.png)

## 4. 提取公共组件

考虑到实际项目中会存在多张图片需要 `Digest` 认证，故提取公共组件 `<auth-img>` ，方便复用。

### 4.1. 组件

---

每个图片请求都单独处理，生成新的随机数。

::: tip
认证图片默认样式（可修改）：

- 图片宽高：与父元素相同
- 适配方式： 包含
- 对齐方式：中部对齐

:::

```vue{11}
<!-- authImg.vue -->
<template>
  <img class="auth-img" ref="authImg" />
</template>

<script>
  import CryptoJS from "crypto-js";
  import { mapState } from "vuex";

  export default {
    name: "AuthImg",
    props: {
      authSrc: {
        type: String,
        default: "",
      },
    },
    computed: {
      ...mapState(["authInfo"]),
    },
    watch: {
      authSrc(val) {
        if (val) {
          this.getImg();
        }
      },
    },
    mounted() {
      this.getImg();
    },
    methods: {
      // 请求图片
      getImg() {
        const digestStr = this.getDigest();
        const img = this.$refs.authImg;
        const request = new XMLHttpRequest();
        request.responseType = "blob";
        request.open("get", this.authSrc, true);
        request.setRequestHeader("Authorization", digestStr);
        request.onreadystatechange = (e) => {
          if (
            request.readyState === XMLHttpRequest.DONE &&
            request.status === 200
          ) {
            img.src = URL.createObjectURL(request.response);
            img.onload = () => {
              URL.revokeObjectURL(img.src);
            };
          }
        };
        request.send(null);
      },

      // 生成 Digest
      getDigest() {
        const cnonce = this.getCnonce();
        const params = {
          ...this.authInfo,
          cnonce,
          uri: this.authSrc,
        };
        const response = this.getResponse(params);
        const { password, method, ...res } = params;
        const digest = {
          ...res,
          response,
        };
        const digestStr =
          "Digest " +
          Object.keys(digest)
            .map((key) => `${key}="${digest[key]}"`)
            .join(",");
        return digestStr;
      },

      // 生成 cnonce
      getCnonce() {
        let cnonce = "";
        const possible =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
          cnonce += possible.charAt(
            Math.floor(Math.random() * possible.length),
          );
        }
        return cnonce;
      },

      // 生成 response
      getResponse(params) {
        const {
          username,
          realm,
          password,
          method,
          uri,
          nonce,
          nc,
          cnonce,
          qop,
        } = params;
        const ha1 = CryptoJS.MD5(username + ":" + realm + ":" + password);
        const ha2 = CryptoJS.MD5(method + ":" + uri);
        const response = CryptoJS.MD5(
          ha1 + ":" + nonce + ":" + nc + ":" + cnonce + ":" + qop + ":" + ha2,
        );
        return response.toString();
      },
    },
  };
</script>

<style lang="scss" scoped>
  .auth-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    vertical-align: middle;
  }
</style>
```

### 4.2. 用法

---

引入 `AuthImg` 组件并传入图片 `authSrc` 即可：

```vue
<!-- demo.vue -->
<template>
  <div class="demo">
    <AuthImg :authSrc="authSrc"></AuthImg>
  </div>
</template>

<script>
  import AuthImg from "@/components/common/authImg.vue";
  export default {
    components: {
      AuthImg,
    },
    data() {
      return {
        authSrc:
          "/ngx/proxy?i=aHR0cDovLzEwLjE3LjY4LjE2ODo4MC9waWN0dXJlL1N0cmVhbWluZy90cmFja3MvMjAzLz9uYW1lPWNoMDAwMDJfMDEwMDJmNDAwMTZkYmNiODUwMDAyNTcyZjAwMDI3NzczMDEwNTAyZjExYjc4MjkzMTQwMCZzaXplPTE1MzM5MQ==",
      };
    },
  };
</script>

<style lang="scss" scoped>
  .demo {
    height: 100%;
  }
</style>
```

效果如下：

![截图](/images/screenshot/auth/digest/authImg2.png)
