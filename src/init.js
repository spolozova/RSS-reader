import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import 'bootstrap';

import initView from './view.js';
import resources from './locales.js';
import parseRss from './parser.js';

const getFullUrl = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`;
const POSTS_REQUEST_TIMER = 5000;

const updatePosts = (state) => {
  const feedsUrls = state.feeds.map((feed) => feed.url);
  const requests = feedsUrls.map((url) => axios.get(getFullUrl(url)));
  Promise.all(requests)
    .then((responses) => responses.map((response) => parseRss(response.data)))
    .then((parsedData) => {
      parsedData.forEach(({ posts }) => posts.forEach((post) => {
        if (!_.find(state.posts, ['link', post.link])) {
          state.postsCounter += 1;
          state.posts = [{
            id: state.postsCounter,
            status: 'unreaded',
            ...post,
          },
          ...state.posts];
        }
      }));
    })
    .finally(() => setTimeout(updatePosts, POSTS_REQUEST_TIMER, state));
};

const schema = yup.string().required().url();

const validate = (state) => {
  const feedsUrls = state.feeds.map((feed) => feed.url);
  const urlValidationSchema = schema.notOneOf(feedsUrls);
  return urlValidationSchema.validate(state.form.value);
};

const getDataForRendering = (state, data) => {
  const { title, description, posts } = data;
  state.feedsCounter += 1;
  state.feeds = [{
    id: state.feedsCounter,
    title,
    description,
    url: state.form.value,
  },
  ...state.feeds,
  ];
  const postsList = posts.map((post) => {
    state.postsCounter += 1;
    return {
      id: state.postsCounter,
      ...post,
    };
  });
  state.posts = [...postsList, ...state.posts];
};

const errorsHandler = (error, state) => {
  console.log(error.type);
  if (error.name === 'ValidationError') {
    state.form.validationState = 'invalid';
    state.form.validationError = error.type;
  } else if (error.message === 'parserError') {
    state.loadingError = error.message;
  } else if (axios.isAxiosError(error)) {
    state.loadingError = 'networkError';
  } else {
    state.loadingError = 'unexpectedError';
  }
};

export default () => {
  const i18nextInstance = i18next.createInstance();

  const state = {
    form: {
      value: '',
      validationState: 'waiting',
      validationError: '',
    },
    processState: 'waiting',
    loadingError: '',
    feeds: [],
    posts: [],
    feedsCounter: 0,
    postsCounter: 0,
    readedPostsId: [],
  };

  i18nextInstance.init({
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
        watchedState.form.validationError = '';
        watchedState.loadingError = '';
        watchedState.form.value = document.querySelector('input').value;
        validate(watchedState)
          .then(() => {
            watchedState.form.validationState = 'valid';
            watchedState.processState = 'loading';
            return axios.get(getFullUrl(watchedState.form.value));
          })
          .then((response) => parseRss(response.data))
          .then((renderedData) => getDataForRendering(watchedState, renderedData))
          .then(() => {
            watchedState.processState = 'processed';
          })
          .catch((err) => {
            watchedState.processState = 'waiting';
            errorsHandler(err, watchedState);
          });
      });
    });
};
