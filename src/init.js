import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import 'bootstrap';

import { initFormView, initFeedsView } from './view.js';
import resources from './locales';

const axios = require('axios');

const parseRss = (data) => {
  const parser = new DOMParser();
  const rssDom = parser.parseFromString(`${data}`, 'aplication/html');
  if (rssDom) {
    const channel = rssDom.querySelector('channel');
    const title = channel.querySelector('title').textContent;
    const description = channel.querySelector('description').textContent;
    const postsData = rssDom.querySelectorAll('item');
    const posts = postsData.map((post) => ({
      link: post.querySelector('link').textContent,
      title: post.querySelector('title').textContent,
      description: post.querySelector('description').textContent,
    }));
    return { title, description, posts };
  }
  throw new Error('parserError');
};

const takeNewPosts = (state) => {
  const promises = state.rssUrls.map((url) => axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`))
    .catch((e) => console.log(e));
  const promise = Promise.all(promises);
  promise.then((responses) => responses.map((response) => parseRss(response.data)))
    .then(({ posts }) => {
      posts.forEach((post) => {
        if (_.find(state.posts, ['link', post.link])) {
          state.postsCounter += 1;
          state.posts = [{
            id: state.postsCounter,
            status: 'unreaded',
            ...post,
          },
          ...state.posts];
        }
      });
    });
};

const schema = yup.string().url('invalidUrl');

export default () => {
  const i18nextInstance = i18next.createInstance();

  const formState = {
    value: '',
    processState: 'filling',
    valid: true,
    feedback: '',
  };
  const feedsState = {
    status: 'waiting',
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
    .then((i18n) => {
      const watchedForm = initFormView(i18n, formState);
      const watchedFeeds = initFeedsView(feedsState);
      const form = document.querySelector('form');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        watchedForm.processState = 'validation';
        watchedForm.feedback = '';
        watchedForm.value = document.querySelector('input').value;
        schema
          .validate(watchedForm.value)
          .then(() => {
            watchedForm.valid = true;
            if (_.indexOf(watchedForm.rssUrls, watchedForm.value) !== -1) {
              watchedFeeds.rssUrls.push(watchedForm.value);
            } else {
              throw new Error('repeatedUrl');
            }
          })
          .then(() => (axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(watchedForm.value)}`)))
          .then((response) => parseRss(response.data))
          .then(({ title, description, posts }) => {
            watchedFeeds.feedsCounter += 1;
            watchedFeeds.feeds.push({ id: watchedFeeds.feedsCounter, title, description });
            posts.forEach((post) => {
              watchedFeeds.postsCounter += 1;
              watchedFeeds.posts.push({
                id: watchedFeeds.postsCounter,
                status: 'unreaded',
                ...post,
              });
            });
            watchedForm.processState = 'succeeded';
            watchedForm.feedback = 'successFeedback';
          })
          .catch((err) => {
            if (err.message === 'invalidUrl' || err.message === 'repeatedUrl') {
              watchedForm.valid = false;
              watchedForm.feedback = e.message;
            } else if (err.message === 'parserError') {
              watchedForm.feedback = e.message;
            } else {
              watchedForm.feedback = 'networkError';
            }
            watchedForm.processState = 'failed';
          });
      });
      const modal = document.querySelector('#modal');
      const readButton = modal.querySelector('full-article');
      const closeButton = modal.querySelector('.btn-secondary');
      readButton.addEventListener('click', () => {
        watchedFeeds.state = 'waiting';
      });
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        watchedFeeds.state = 'waiting';
      });

      setTimeout(function run() {
        takeNewPosts(watchedFeeds);
        setTimeout(run, 5000);
      }, 5000);
    });
};
