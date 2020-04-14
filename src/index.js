/*
 * @Author: Tser
 * @Date: 2020-03-28 22:01:28
 * @GitHub: https://github.com/TserHub
 * @LastEditors: qinWenMeng
 * @LastEditTime: 2020-04-14 13:35:55
 */
import moment from 'moment';

// 身份证号码验证
export const isIdCardNumber = (idCard) => {
  if (!idCard) {
    return false;
  }
  idCard = idCard.trim();
  // 18位身份证号码的正则表达式
  const regIdCard = /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$/;
  if (!regIdCard.test(idCard)) {
    return false;
  }
  // 如果通过该验证，说明身份证格式正确，但准确性还需计算
  const idCardWi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]; // 将前17位加权因子保存在数组里
  const idCardY = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2]; // 这是除以11后，可能产生的11位余数、验证码，也保存成数组
  let idCardWiSum = 0; // 用来保存前17位各自乖以加权因子后的总和
  for (let i = 0; i < 17; i++) {
    idCardWiSum += idCard.substring(i, i + 1) * idCardWi[i];
  }
  const idCardMod = idCardWiSum % 11; // 计算出校验码所在数组的位置
  const idCardLast = idCard.substring(17); // 得到最后一位身份证号码
  switch (idCardMod) {
    case 2:
      // 如果等于2，则说明校验码是10，身份证号码最后一位应该是X
      return idCardLast === 'X' || idCardLast === 'x';
    default:
      // 用计算出的验证码与最后一位身份证号码匹配，如果一致，说明通过，否则是无效的身份证号码
      return idCardLast === idCardY[idCardMod];
  }
};

// 地图坐标转换
export const GPS = {
  PI: 3.14159265358979324,
  x_pi: (3.14159265358979324 * 3000.0) / 180.0,
  delta: function (lat, lon) {
    // Krasovsky 1940
    //
    // a = 6378245.0, 1/f = 298.3
    // b = a * (1 - f)
    // ee = (a^2 - b^2) / a^2;
    var a = 6378245.0; //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
    var ee = 0.00669342162296594323; //  ee: 椭球的偏心率。
    var dLat = this.transformLat(lon - 105.0, lat - 35.0);
    var dLon = this.transformLon(lon - 105.0, lat - 35.0);
    var radLat = (lat / 180.0) * this.PI;
    var magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    var sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * this.PI);
    dLon = (dLon * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * this.PI);
    return { lat: dLat, lon: dLon };
  },

  //WGS-84 to GCJ-02 GPS转高德
  gcj_encrypt: function (wgsLat, wgsLon) {
    if (this.outOfChina(wgsLat, wgsLon)) return { lat: wgsLat, lon: wgsLon };

    var d = this.delta(wgsLat, wgsLon);
    //      return {'lat' : wgsLat + d.lat,'lon' : wgsLon + d.lon};
    return {
      lat: parseFloat(wgsLat) + parseFloat(d.lat),
      lon: parseFloat(wgsLon) + parseFloat(d.lon),
    };
  },
  //GCJ-02 to WGS-84 高德转GPS
  gcj_decrypt: function (gcjLat, gcjLon) {
    if (this.outOfChina(gcjLat, gcjLon)) return { lat: gcjLat, lon: gcjLon };

    var d = this.delta(gcjLat, gcjLon);
    return { lat: gcjLat - d.lat, lon: gcjLon - d.lon };
  },
  //GCJ-02 to WGS-84 exactly
  gcj_decrypt_exact: function (gcjLat, gcjLon) {
    var initDelta = 0.01;
    var threshold = 0.000000001;
    var dLat = initDelta,
      dLon = initDelta;
    var mLat = gcjLat - dLat,
      mLon = gcjLon - dLon;
    var pLat = gcjLat + dLat,
      pLon = gcjLon + dLon;
    var wgsLat,
      wgsLon,
      i = 0;
    while (1) {
      wgsLat = (mLat + pLat) / 2;
      wgsLon = (mLon + pLon) / 2;
      var tmp = this.gcj_encrypt(wgsLat, wgsLon);
      dLat = tmp.lat - gcjLat;
      dLon = tmp.lon - gcjLon;
      if (Math.abs(dLat) < threshold && Math.abs(dLon) < threshold) break;

      if (dLat > 0) pLat = wgsLat;
      else mLat = wgsLat;
      if (dLon > 0) pLon = wgsLon;
      else mLon = wgsLon;

      if (++i > 10000) break;
    }
    //console.log(i);
    return { lat: wgsLat, lon: wgsLon };
  },
  //GCJ-02 to BD-09 高德转百度
  bd_encrypt: function (gcjLat, gcjLon) {
    var x = gcjLon,
      y = gcjLat;
    var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.x_pi);
    var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.x_pi);
    bdLon = z * Math.cos(theta) + 0.0065;
    bdLat = z * Math.sin(theta) + 0.006;
    return { lat: bdLat, lon: bdLon };
  },
  //BD-09 to GCJ-02 百度转高德
  bd_decrypt: function (bdLat, bdLon) {
    var x = bdLon - 0.0065,
      y = bdLat - 0.006;
    var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_pi);
    var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_pi);
    var gcjLon = z * Math.cos(theta);
    var gcjLat = z * Math.sin(theta);
    return { lat: gcjLat, lon: gcjLon };
  },
  //WGS-84 to Web mercator
  //mercatorLat -> y mercatorLon -> x
  mercator_encrypt: function (wgsLat, wgsLon) {
    var x = (wgsLon * 20037508.34) / 180;
    var y =
      Math.log(Math.tan(((90 + wgsLat) * this.PI) / 360)) / (this.PI / 180);
    y = (y * 20037508.34) / 180;
    return { lat: y, lon: x };
    /*
     if ((Math.abs(wgsLon) > 180 || Math.abs(wgsLat) > 90))
     return null;
     var x = 6378137.0 * wgsLon * 0.017453292519943295;
     var a = wgsLat * 0.017453292519943295;
     var y = 3189068.5 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
     return {'lat' : y, 'lon' : x};
     //*/
  },
  // Web mercator to WGS-84
  // mercatorLat -> y mercatorLon -> x
  mercator_decrypt: function (mercatorLat, mercatorLon) {
    var x = (mercatorLon / 20037508.34) * 180;
    var y = (mercatorLat / 20037508.34) * 180;
    y =
      (180 / this.PI) *
      (2 * Math.atan(Math.exp((y * this.PI) / 180)) - this.PI / 2);
    return { lat: y, lon: x };
    /*
     if (Math.abs(mercatorLon) < 180 && Math.abs(mercatorLat) < 90)
     return null;
     if ((Math.abs(mercatorLon) > 20037508.3427892) || (Math.abs(mercatorLat) > 20037508.3427892))
     return null;
     var a = mercatorLon / 6378137.0 * 57.295779513082323;
     var x = a - (Math.floor(((a + 180.0) / 360.0)) * 360.0);
     var y = (1.5707963267948966 - (2.0 * Math.atan(Math.exp((-1.0 * mercatorLat) / 6378137.0)))) * 57.295779513082323;
     return {'lat' : y, 'lon' : x};
     //*/
  },
  // two point's distance
  distance: function (latA, lonA, latB, lonB) {
    var earthR = 6371000;
    var x =
      Math.cos((latA * this.PI) / 180) *
      Math.cos((latB * this.PI) / 180) *
      Math.cos(((lonA - lonB) * this.PI) / 180);
    var y = Math.sin((latA * this.PI) / 180) * Math.sin((latB * this.PI) / 180);
    var s = x + y;
    if (s > 1) s = 1;
    if (s < -1) s = -1;
    var alpha = Math.acos(s);
    var distance = alpha * earthR;
    return distance;
  },
  outOfChina: function (lat, lon) {
    if (lon < 72.004 || lon > 137.8347) return true;
    if (lat < 0.8293 || lat > 55.8271) return true;
    return false;
  },
  transformLat: function (x, y) {
    var ret =
      -100.0 +
      2.0 * x +
      3.0 * y +
      0.2 * y * y +
      0.1 * x * y +
      0.2 * Math.sqrt(Math.abs(x));
    ret +=
      ((20.0 * Math.sin(6.0 * x * this.PI) +
        20.0 * Math.sin(2.0 * x * this.PI)) *
        2.0) /
      3.0;
    ret +=
      ((20.0 * Math.sin(y * this.PI) + 40.0 * Math.sin((y / 3.0) * this.PI)) *
        2.0) /
      3.0;
    ret +=
      ((160.0 * Math.sin((y / 12.0) * this.PI) +
        320 * Math.sin((y * this.PI) / 30.0)) *
        2.0) /
      3.0;
    return ret;
  },
  transformLon: function (x, y) {
    var ret =
      300.0 +
      x +
      2.0 * y +
      0.1 * x * x +
      0.1 * x * y +
      0.1 * Math.sqrt(Math.abs(x));
    ret +=
      ((20.0 * Math.sin(6.0 * x * this.PI) +
        20.0 * Math.sin(2.0 * x * this.PI)) *
        2.0) /
      3.0;
    ret +=
      ((20.0 * Math.sin(x * this.PI) + 40.0 * Math.sin((x / 3.0) * this.PI)) *
        2.0) /
      3.0;
    ret +=
      ((150.0 * Math.sin((x / 12.0) * this.PI) +
        300.0 * Math.sin((x / 30.0) * this.PI)) *
        2.0) /
      3.0;
    return ret;
  },
};

export const transformDateTime = (t, hasTime = true) => {
  // 字符串类型日期转换为moment类型，moment类型的日期，无需转换
  const time = typeof t === 'string' ? moment(new Date(t)) : t;
  return time.format(hasTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD');
};
export const transTime = (time, flag) => {
  switch (flag) {
    case 'start':
      return `${time} 00:00:00`;
    case 'end':
      return `${time} 23:59:59`;
    default:
      return time;
  }
};

// 校验 min-max 整数
export const isIntValue = (val, { min, max }) => {
  const regex = new RegExp(`^[0-9]{${min},${max}}$`);
  return regex.test(val);
};

// 校验小数
export const isDecimalValue = (val) => {
  return /^\d+(\.\d+)?$/.test(val);
};

// 校验数值
export const isNumericValue = (val) => {
  return /^[+-]?\d+(\.\d+)?$/.test(val);
};

// 校验绝对值区间
export const isAbsRangeValue = (val, { min, max }) => {
  const value = Math.abs(val);
  return min <= value && value <= max;
};

// 校验 0 值
export const isZeroValue = (val) => {
  return Number(val) === 0;
};

export const downloadLink = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const jobStatus = {
  unhandle: '1', // 未处理
  importDb: '10', // 导入数据库
  importDone: '13', // 导入完成，可以开始处理账单
  handleBill: '15', // 开始处理账单
  handleDone: '30', // 处理完毕，可以开始下载明细
};

export default {
  isIdCardNumber,
  GPS,
  transformDateTime,
  transTime,
  isIntValue,
  isDecimalValue,
  isNumericValue,
  isAbsRangeValue,
  isZeroValue,
  downloadLink,
  jobStatus,
};