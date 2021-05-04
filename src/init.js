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
            document.querySelectorAll('[data-bs-toggle="modal"]').forEach((button) => {
              button.addEventListener('click', (event) => {
                watchedState.readedPostsId.push(event.target.dataset.id);
                watchedState.processState = 'reading';
              });
            });
            const aEl = document.querySelectorAll('a');
            aEl.forEach((el) => el.addEventListener('click', (ev) => {
              watchedState.readedPostsId.push(ev.target.dataset.id);
            }));
            const modal = document.querySelector('.modal');
            modal.addEventListener('hide.bs.modal', () => {
              watchedState.processState = 'waiting';
            });
            watchedState.form.feedback = 'success';
            watchedState.form.state = 'succeeded';
            watchedState.rssUrls.push(watchedState.form.value);
          })
          .then(() => {
            setTimeout(function run() {
              updatePosts(watchedState);
              setTimeout(run, POSTS_REQUEST_TIMER);
            }, POSTS_REQUEST_TIMER);
          })
          .catch((err) => {
            if (err.message === 'invalidUrl' || err.message === 'repeatedUrl') {
              watchedState.form.valid = false;
              watchedState.form.feedback = err.message;
            } else if (err.message === 'parserError') {
              watchedState.form.feedback = err.message;
            } else if (err.message === 'empty') {
              watchedState.form.feedback = err.message;
            } else {
              watchedState.form.feedback = 'networkError';
            }
            watchedState.form.state = 'failed';
          });
      });
    });
};
