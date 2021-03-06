import { routerRedux } from 'dva/router';
import { getPageQuery } from './utils/utils';
import {fakeAccountLogin, getFakeCaptcha, xcLogin, xcLoginMobile} from './service';
import { Reducer } from 'redux';
import { EffectsCommandMap } from 'dva';
import { AnyAction } from 'redux';
import { setAuthority } from '@/utils/authority';
import {setRequestToken } from '@/utils/request';

export interface IStateType {
  status?: 'ok' | 'error';
  type?: string;
  currentAuthority?: 'user' | 'guest' | 'admin';
}

export type Effect = (
  action: AnyAction,
  effects: EffectsCommandMap & { select: <T>(func: (state: IStateType) => T) => T },
) => void;

export interface ModelType {
  namespace: string;
  state: IStateType;
  effects: {
    login: Effect;
    getCaptcha: Effect;
  };
  reducers: {
    changeLoginStatus: Reducer<IStateType>;
  };
}

const Model: ModelType = {
  namespace: 'userLogin',

  state: {
    status: undefined,
  },

  effects: {
    *login({ payload }, { call, put }) {
      const response = yield call(payload.loginType===1?xcLoginMobile:xcLogin, payload);
      response.type=payload.type;

      yield put({
        type: 'changeLoginStatus',
        payload: response,
      });

      // Login successfully
      if (response.code === 1) {
        const urlParams = new URL(window.location.href);
        const params = getPageQuery();
        let { redirect } = params as { redirect: string };
        if (redirect) {
          const redirectUrlParams = new URL(redirect);
          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);
            if (redirect.match(/^\/.*#/)) {
              redirect = redirect.substr(redirect.indexOf('#') + 1);
            }
          } else {
            window.location.href = redirect;
            return;
          }
          yield put(routerRedux.replace(redirect || '/'));
        }else{
          window.location.href = "/xc-demo/list";
        }

      }
    },

    *getCaptcha({ payload }, { call }) {
      yield call(getFakeCaptcha, payload);
    },



  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      if(payload.code!=1) {
        payload.status='error';
      }else{
        payload.status='ok';
        payload.currentAuthority='admin';
        setRequestToken(payload.result.token);
      }
      setAuthority(payload.currentAuthority);
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      };
    },
  },
};


export default Model;
