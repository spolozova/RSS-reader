import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import 'bootstrap';

import initView from './view.js';
import resources from './locales.js';
import parseRss from './parser.js';

const POSTS_REQUEST_TIMER = 5000;
const PROXY_URL = 'https://hexlet-allorigins.herokuapp.com';

const getFullUrl = (url) => {
  const fullUrl = new URL('/get', PROXY_URL);
  fullUrl.searchParams.set('disableCache', 'true');
  fullUrl.searchParams.set('url', url);
  return fullUrl.toString();
};

const updateFeedsData = (state, data, url) => {
  const { title, description, posts } = data;
  state.feeds = [{
    id: _.uniqueId(),
    title,
    description,
    url,
  },
  ...state.feeds,
  ];
  const postsList = posts.map((post) => ({ id: _.uniqueId(), ...post }));
  state.posts = [...postsList, ...state.posts];
};

const loadRss = (url, state) => {
  state.loadingProcessState = 'loading';
  const fullUrl = getFullUrl(url);
  return axios.get(fullUrl)
    .then((response) => parseRss(response.data))
    .then((parsedData) => updateFeedsData(state, parsedData, url))
    .then(() => {
      state.loadingProcessState = 'processed';
    })
    .catch((error) => {
      state.loadingProcessState = 'failed';
      if (error.isAxiosError) {
        error.code = 'networkError';
      } else if (!error.isAxiosError && !error.code) {
        error.code = 'unexpectedError';
      }
      state.loadingError = error.code;
    });
};
const isDifference = (object1, object2) => {
  if (object1.guid) {
    return object1.guid === object2.guid;
  }
  return object1.link === object2.link && object1.title === object2.title;
};

const updatePosts = (state) => {
  const feedsUrls = state.feeds.map((feed) => feed.url);
  const requests = feedsUrls.map((url) => axios.get(getFullUrl(url)));
  Promise.all(requests)
    .then((responses) => responses.map((response) => parseRss(response.data)))
    .then((parsedData) => {
      const newPosts = parsedData
        .flatMap(({ posts }) => _.differenceWith(posts, state.posts, isDifference));
      newPosts.forEach((post) => {
        state.posts = [{
          id: _.uniqueId(),
          status: 'unreaded',
          ...post,
        },
        ...state.posts];
      });
    })
    .finally(() => setTimeout(updatePosts, POSTS_REQUEST_TIMER, state));
};

const schema = yup.string().required().url();

const validate = (url, state) => {
  const feedsUrls = state.feeds.map((feed) => feed.url);
  const urlValidationSchema = schema.notOneOf(feedsUrls);
  return urlValidationSchema.validate(url)
    .then(() => {
      state.form.validationState = 'valid';
    })
    .catch((e) => {
      e.code = e.type;
      throw e;
    });
};

export default () => {
  const i18nextInstance = i18next.createInstance();

  const state = {
    form: {
      validationState: 'waiting',
      validationError: null,
    },
    loadingProcessState: 'waiting',
    loadingError: null,
    feeds: [],
    posts: [],
    readedPost: null,
  };

  return i18nextInstance.init({
    lng: 'ru',
    resources,
  })
    .then((t) => {
      const watchedState = initView(t, state);
      setTimeout(updatePosts, POSTS_REQUEST_TIMER, watchedState);
      const form = document.querySelector('form');
      const postsContainer = document.querySelector('.posts');
      postsContainer.addEventListener('click', (event) => {
        const { id, bsToggle } = event.target.dataset;
        watchedState.posts.forEach((post) => {
          if (`${post.id}` === id) {
            post.readed = true;
          }
        });
        if (bsToggle === 'modal') {
          watchedState.readedPost = watchedState.posts.find((post) => `${post.id}` === id);
        }
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedState.form.validationState = 'processing';
        watchedState.form.validationError = null;
        watchedState.loadingError = null;
        const url = document.querySelector('input').value;
        validate(url, watchedState)
          .then(() => {
            loadRss(url, watchedState);
          })
          .catch((err) => {
            watchedState.form.validationState = 'invalid';
            watchedState.form.validationError = err.code;
          });
      });
    });
};
