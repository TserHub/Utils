/*
 * @Author: Tser
 * @Date: 2020-03-28 22:01:28
 * @GitHub: https://github.com/TserHub
 * @LastEditors: Tser
 * @LastEditTime: 2020-04-22 13:24:10
 */
import moment from "moment";

export const transformDateTime = (t, hasTime = true) => {
  // 字符串类型日期转换为moment类型，moment类型的日期，无需转换
  const time = typeof t === "string" ? moment(new Date(t)) : t;
  return time.format(hasTime ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD");
};

export const transTime = (time, flag) => {
  switch (flag) {
    case "start":
      return `${time} 00:00:00`;
    case "end":
      return `${time} 23:59:59`;
    default:
      return time;
  }
};

export const isAccept = (acceptType, fileName) => {
  return acceptType.split(",").some((type) => {
    const regExp = new RegExp(`\\${type}$`);
    return regExp.test(fileName);
  });
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
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const jobStatus = {
  unhandle: "1", // 未处理
  importDb: "10", // 导入数据库
  importDone: "13", // 导入完成，可以开始处理账单
  handleBill: "15", // 开始处理账单
  handleDone: "30", // 处理完毕，可以开始下载明细
};

export default {
  transformDateTime,
  transTime,
  isAccept,
  isIntValue,
  isDecimalValue,
  isNumericValue,
  isAbsRangeValue,
  isZeroValue,
  downloadLink,
  jobStatus,
};
