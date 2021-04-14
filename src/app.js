import * as yup from 'yup';
import _ from 'lodash';
import initView from './view.js';

const axios = require('axios');

const parseRss = (data) => {
  const parser = new DOMParser();
  const rssDom = parser.parseFromString(`${data.data}`, 'aplication/html');
  if (rssDom) {
    const channel = rssDom.querySelector('channel');
    const title = channel.querySelector('title');
    const description = channel.querySelector('description');
    const posts = rssDom.querySelectorAll('item');
    return { title, description, posts };
  }
  throw new Error('Ресурс не содержит валидный RSS');
};

const schema = yup.string().url('Ссылка должна быть валидным URL');

export default () => {
  const state = {
    form: {
      processState: 'filling',
      submitCounter: 0,
      valid: true,
      errors: {},
    },
    rssUrls: [],
    feeds: [],
    posts: [],
    postsCounter: 1,
    errors: {},
  };
  const watchedState = initView(state);

  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.processState = 'validation';
    watchedState.form.processFeedback = '';
    watchedState.form.value = e.target.value;
    schema
      .validate(watchedState.form.value)
      .then(() => {
        watchedState.form.valid = true;
        if (_.indexOf(watchedState.rssUrls, watchedState.form.Value) !== -1) {
          watchedState.form.submitCounter += 1;
          watchedState.form.rssUrls.push(watchedState.form.value);
          axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(watchedState.form.value)}`)
            .then((response) => parseRss(response))
            .then(({ title, description, posts }) => {
              watchedState.feeds.push({ title, description, id: watchedState.form.submitCounter });
              posts.forEach((post) => {
                watchedState.posts.push({ id: watchedState.postsCounter, post });
                watchedState.postsCounter += 1;
              });
              watchedState.form.processState = 'succeeded';
              watchedState.form.processFeedback = 'RSS успешно загружен';
            })
            .catch((err) => {
              watchedState.form.processState = 'failed';
              watchedState.form.processFeedback = err;
            });
        } else {
          throw new Error('RSS уже существует');
        }
      })
      .catch((err) => {
        watchedState.form.validationFeedback = err;
        watchedState.form.valid = false;
        console.log(err);
      });
  });
};
