import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000' });

export const getFunds    = ()                          => api.get('/funds');
export const getNavData  = (fund_id, start, end)       => api.get('/nav-data',  { params: { fund_id, start, end } });
export const getDetect   = (fund_id, date)             => api.get('/detect-behavior', { params: { fund_id, date } });
export const getPanicTax = (fund_id, start, end)       => api.get('/panic-tax', { params: { fund_id, start, end } });
export const getCompare  = (fund_id, start, end)       => api.get('/compare-strategy', { params: { fund_id, start, end } });
export const getHerd     = (start, end)                => api.get('/herd-score', { params: { start, end } });
export const getNudges   = (fund_id, date)             => api.get('/nudges', { params: { fund_id, date } });
export const getSummary  = (fund_id)                   => api.get('/dashboard-summary', { params: { fund_id } });
export const getPanicWindows = ()                      => api.get('/panic-windows');
export const uploadPortfolio = (file)                  => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload-portfolio', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const timeMachineCalculate = (fund_id, date, amount) => api.get('/time-machine', { params: { fund_id, date, amount } });
