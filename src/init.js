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
  const requests = state.rssUrls.map((url) => axios.get(getFullUrl(url)));
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
    });
  setTimeout(updatePosts, POSTS_REQUEST_TIMER, state);
};

const schema = yup.string().required('empty').url('invalidUrl');

const validate = (state) => schema.validate(state.form.value)
  .then(() => {
    state.form.valid = true;
    if (_.indexOf(state.rssUrls, state.form.value) !== -1) {
      throw new Error('repeatedUrl');
    }
  });

const dataForRendering = (state, data) => {
  const { title, description, posts } = data;
  state.feedsCounter += 1;
  state.feeds = [{
    id: state.feedsCounter,
    title,
    description,
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
  if (error.message === 'invalidUrl' || error.message === 'repeatedUrl') {
    state.form.valid = false;
    state.form.feedback = error.message;
  } else if (error.message === 'parserError') {
    state.form.feedback = error.message;
  } else if (error.message === 'empty') {
    state.form.feedback = error.message;
  } else {
    state.form.feedback = 'networkError';
  }
  state.form.state = 'failed';
};

export default () => {
  const i18nextInstance = i18next.createInstance();

  const state = {
    form: {
      value: '',
      state: 'filling',
      valid: true,
      feedback: '',
    },
    processState: 'waiting',
    rssUrls: [],
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
      const form = document.querySelector('form');
      const modal = document.querySelector('.modal');
      const postsContainer = document.querySelector('.posts');
      postsContainer.addEventListener('click', (event) => {
        const { target } = event;
        if (target.dataset.bsToggle === 'modal') {
          watchedState.readedPostsId.push(event.target.dataset.id);
          watchedState.processState = 'reading';
        } else if (target.tagName === 'A') {
          watchedState.readedPostsId.push(target.dataset.id);
        }
      });
      modal.addEventListener('hide.bs.modal', () => {
        watchedState.processState = 'waiting';
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedState.form.state = 'validation';
        watchedState.form.feedback = '';
        watchedState.form.value = document.querySelector('input').value;
        validate(watchedState)
          .then(() => axios.get(getFullUrl(watchedState.form.value)))
          .then((response) => parseRss(response.data))
          .then((renderedData) => dataForRendering(watchedState, renderedData))
          .then(() => {
            watchedState.form.feedback = 'success';
            watchedState.form.state = 'succeeded';
            watchedState.rssUrls.push(watchedState.form.value);
            setTimeout(updatePosts, POSTS_REQUEST_TIMER, watchedState);
          })
          .catch((err) => errorsHandler(err, watchedState));
      });
    });
};
