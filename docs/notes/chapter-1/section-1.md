---
title: Digest Auth
comments: true
tags:
  - Digest
  - AES
  - MD5
  - CryptoJS
  - 加密
  - 解密
  - 认证
---

## 前言

`Digest Auth` 即摘要认证，可以避免密码以明文方式传输，通常分为四个步骤：

::: tip

1. 客户端请求服务端，服务端不知道客户端是否真的知道密码，请求失败。
2. 服务端返回 `401` ，并返回 `WWW-Authenticate` 字段，该字段中包含认证所需要的参数。
3. 客户端根据 `WWW-Authenticate` 中的信息，选择加密算法，结合随机数 `cnonce`，计算出认证摘要 `Digest` ，然后带着 `Digest` 再次请求服务端。
4. 服务端将客户端提供的 `Digest` 与服务器内部计算出的结果进行对比。如果匹配，就说明客户端知道密码，认证通过；否则，认证失败。

:::

<img class="zoomable" :src="$withBase('/images/screenshot/notes/1/1/1.png')" alt="foo">

为了减少请求数量，项目中将第 `1` 、`2` 步改为：前端请求一次后台接口来获取 `Digest` 认证所需的参数，并保存起来。后续请求图片时，直接走第 `3` 、`4` 步。

## 1. 获取参数

### 1.1. 参数介绍

---

计算最终的 `Digest` 需要以下参数（ `authInfo` 内的）：

```js
const authInfo = {
  username: "admin", // 用户名
  password: "hhll^124", // 密码
  realm: "9ee3667be2d1d1dbe08d7486", // 一般是域名
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

| 参数        | 描述                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `username`  | **用户名**，标识请求的发起者身份。用于计算 `HA1` 。                                                                           |
| `password`  | **密码**，是用户身份验证的关键信息。 用于计算 `HA1` 。                                                                        |
| `realm`     | **认证领域**，用于区分不同的保护空间。用于计算 `HA1` 。                                                                       |
| `qop`       | **保护质量**，用于指定认证的质量和保护级别。 用于计算 `Digest` 。                                                             |
| `nonce`     | **服务器随机数**，用于防止重放攻击。用于计算 `Digest` 。<br/> （每次认证请求时，服务器会提供一个新的 nonce 值。）             |
| `nc`        | **客户端请求计数器**，是一个 8 位十六进制数，每次请求递增。用于计算 `Digest` 。<br/> （用于防止重放攻击，确保请求的顺序性。） |
| `cnonce`    | **客户端随机数**，用于增加摘要的随机性。 用于计算 `Digest` 。                                                                 |
| `method`    | **请求方法**，用于计算 `HA2` 。                                                                                               |
| `uri`       | **资源路径**，请求资源的 uri，用于计算 `HA2` 。                                                                               |
| `algorithm` | **哈希算法**，用于生成摘要。                                                                                                  |
| `opaque`    | 服务器返回的一个不透明的字符串，客户端在响应中需要原样返回。用于**跟踪请求状态**。                      |

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

由于密码不能明文传输，后台返回的密码是经过加密的，所以需要对密码进行解密，才能用于计算 `Digest`。

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

随机数 `cnonce` 固定容易被破解，因此每次请求时客户端生成一个新的随机数。

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
    // 生成HA1
    getHA1(username, realm, password) {
      const ha1Str = `${username}:${realm}:${password}`;
      return CryptoJS.MD5(ha1Str).toString();
    },

    // 生成HA2
    getHA2(method, uri, qop) {
      if (qop === "auth") {
        const ha2Str = `${method}:${uri}`;
        return CryptoJS.MD5(ha2Str).toString();
      } else if (qop === "auth-int") {
        // 这里为 auth-int 情况的简单示例，实际中可能需要处理请求体
        const ha2Str = `${method}:${uri}`;
        return CryptoJS.MD5(ha2Str).toString();
      }
      return null;
    },

    // 生成 response
    getResponse(params) {
      const { username, realm, password, method, uri, nonce, nc, cnonce, qop } =
        params;
      const ha1 = this.getHA1(username, realm, password);
      const ha2 = this.getHA2(method, uri, qop);
      const response = "";
      if (qop === "auth" || qop === "auth-int") {
        response = `${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`;
      } else {
        response = `${ha1}:${nonce}:${ha2}`;
      }
      return response.toString();
    },
  },
};
```

::: details 思考一： QOP （保护质量）的取值及对生成 Digest 有什么影响？

| qop 取值   | HA2 计算                                                                                                                            | Response 计算                                                                                                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth`     | 只考虑请求方法和请求的 URI。 <br/><br/>**公式：`HA2 = MD5(method:uri)` 。**                                                             | 最终的 Response 计算会包含 nc 和 cnonce。<br/><br/>**公式：`Response = MD5(HA1:nonce:nc:cnonce:auth:HA2)` 。**<br/><br/>这种方式提供了基本的认证功能，防止用户身份被冒用。                                     |
| `auth-int` | 除了请求方法和请求的 URI，还需要考虑请求体的内容，以确保消息的完整性。<br/><br/>**公式： `HA2 = MD5(method:uri:MD5(request-body))` 。** | 与 auth 情况类似，最终的 Response 计算包含 nc 和 cnonce。<br/><br/>**公式：`Response = MD5(HA1:nonce:nc:cnonce:auth-int:HA2)` 。**<br/><br/>这种方式不仅提供认证功能，还能保证请求内容在传输过程中没有被篡改。 |
| 其他情况   | 与 auth 情况类似，只考虑请求方法和请求的 URI。                                                                                      | 不包含 nc 和 cnonce。<br/><br/>**公式：`Response = MD5(HA1:nonce:HA2)` 。**<br/><br/> 这种方式提供的安全性相对较低，因为没有请求计数和客户端随机数的保护。                                                   |

:::

::: details 思考二： 为什么要单独计算 HA1 和 HA2，而不是直接计算所有参数？

::: tip

1. **『安全性提升』**
   - **密码保护**
     - **减少密码暴露风险：**
       `HA1` 是由用户名、realm 和密码生成的哈希值。<strong style="color:green">将密码参与的计算独立出来，在后续请求中可以复用 HA1，而无需每次都重新使用明文密码，降低了风险。</strong> 如果直接将所有参数一起计算，密码需要频繁参与计算，增加了密码泄露的风险。例如，若攻击者截获了包含密码的计算过程，就可能获取到用户的敏感信息。
     - **抵御暴力破解：**
       单独计算 `HA1` 可以使密码以哈希形式存在于计算过程中。<strong style="color:green">即使攻击者获取到 HA1，由于哈希算法的单向性，很难通过 HA1 反推出原始密码。</strong>而且，由于 realm 的加入，不同的认证领域会生成不同的 HA1，进一步增加了暴力破解的难度。
   - **防止重放攻击**
     - **请求唯一性：**
       `HA2` 是基于请求方法和请求 URI 生成的哈希值，它反映了每个请求的独特性。通过将 HA2 与其他参数结合计算 Digest，<strong style="color:green">确保了每个请求的摘要都是唯一的。</strong>如果直接将所有参数一次性计算，可能会导致不同请求生成相同摘要的风险增加，从而容易受到重放攻击。例如，攻击者可能会重复发送相同的请求，若没有 HA2 体现请求的独特性，服务器可能无法识别这是重放请求。

---

2. **『性能优化』**
   - **减少重复计算**
     - **HA1 复用：**
       在多次请求中，只要用户的身份信息（用户名、realm、密码）不变，`HA1` 的值就不会改变。因此，<strong style="color:green">客户端和服务器可以在多次请求中复用 HA1，避免了重复计算相同的哈希值，提高了计算效率。</strong>例如，用户在一段时间内多次访问同一认证领域下的不同资源，只需要计算一次 HA1，后续请求直接使用该值参与 Digest 的计算。
     - **独立更新：**
       <strong style="color:green">当请求的部分信息发生变化时，只需要重新计算受影响的部分。</strong>例如，如果请求的 URI 发生变化，只需要重新计算 `HA2` ，而不需要重新计算 HA1，减少了不必要的计算开销。

---

3. **『灵活性和扩展性』**

- **支持不同的认证策略**
  - **QOP 调整：**
    `qop`（保护质量）参数可以指定不同的认证策略，如 `auth`（认证）和 `auth - int`（认证和完整性保护）。<strong style="color:green">不同的 qop 值会影响 HA2 的计算方式。</strong>通过分别计算 HA1 和 HA2，可以方便地根据不同的 qop 值调整 HA2 的计算逻辑，而不影响 HA1 的计算。例如，当 qop 为 auth - int 时，HA2 的计算可能需要考虑请求体的内容，以确保消息的完整性。
- **适应不同的应用场景：**
  不同的应用场景可能对认证信息有不同的需求。分别计算 HA1 和 HA2 可以使认证系统更加灵活地适应这些需求。<strong style="color:green">通过分离身份信息（HA1）和请求信息（HA2），可以方便地对不同部分进行定制和扩展。</strong>例如，某些应用可能需要对用户身份进行更复杂的验证，而另一些应用可能更关注请求的完整性。

:::

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
由于 `HTML` 中的 `<img>` 标签获取图片是浏览器内部完成的，没有走前端封装好的 `axios` 请求，故无法在 `axios` 请求中添加请求头。
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

<img class="zoomable" :src="$withBase('/images/screenshot/notes/1/1/2.png')" alt="screenshot">

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

```vue {11}
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

      // 生成HA1
      getHA1(username, realm, password) {
        const ha1Str = `${username}:${realm}:${password}`;
        return CryptoJS.MD5(ha1Str).toString();
      },

      // 生成HA2
      getHA2(method, uri, qop) {
        if (qop === "auth") {
          const ha2Str = `${method}:${uri}`;
          return CryptoJS.MD5(ha2Str).toString();
        } else if (qop === "auth-int") {
          // 这里为 auth-int 情况的简单示例，实际中可能需要处理请求体
          const ha2Str = `${method}:${uri}`;
          return CryptoJS.MD5(ha2Str).toString();
        }
        return null;
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
        const ha1 = this.getHA1(username, realm, password);
        const ha2 = this.getHA2(method, uri, qop);
        const response = "";
        if (qop === "auth" || qop === "auth-int") {
          response = `${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`;
        } else {
          response = `${ha1}:${nonce}:${ha2}`;
        }
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

<img class="zoomable" :src="$withBase('/images/screenshot/notes/1/1/3.png')" alt="screenshot">

<!-- ![图片](/ns-blog/images/screenshot/notes/1/1/2.png) -->
