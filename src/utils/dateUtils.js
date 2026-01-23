export const getLocalDateString = (date = new Date()) => {
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().split('T')[0];
};

export default {
  getLocalDateString,
};

