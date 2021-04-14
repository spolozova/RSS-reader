const onChange = require('on-change');

const feedbackHandler = (state, value) => {
  const feedback = document.querySelector('.feedback');
  const input = document.querySelector('input');
  feedback.textContent = '';
  feedback.classList.remove('text-success, text-danger');
  if (state.form.valid === false) {
    feedback.classList.add('text-danger');
    input.classList.add('is-invalid');
  } else if (state.form.valid === true) {
    input.classList.remove('is-invalid');
  } else if (state.form.processState === 'failed') {
    feedback.classList.add('text-danger');
  } else {
    feedback.classList.add('text-success');
  }
  feedback.textContent = value;
};

const renderFeeds = (feeds) => {
  const feedContainer = document.querySelector('.feeds');
  feedContainer.innerHTML = '<h2>Фиды</h2>';
  const ulElement = document.createElement('ul');
  ulElement.classList.add('list-group, mb-5');
  feeds.forEach(({ title, description }) => {
    const liElement = document.createElement('li');
    liElement.classList.add('list-group-item');
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    const pElement = document.createElement('p');
    pElement.textContent = description;
    ulElement.append(titleElement, pElement);
  });
  feedContainer.append(ulElement);
};

const renderPosts = (posts) => {
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = '<h2>Посты</h2>';
  const ulElement = document.createElement('ul');
  ulElement.classList.add('list-group');
  posts.forEach(({ id, post }) => {
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const aEl = document.createElement('a');
    aEl.href = post.querySelector('link').textContent;
    aEl.textContent = post.querySelector('title').textContent;
    aEl.classList.add('font-weight-bold');
    aEl.setAttribute('data-id', id);
    aEl.setAttribute('target', '_blank');
    liEl.append(aEl);
    ulElement.prepend(liEl);
  });
  postsContainer.prepend(ulElement);
};

const processStateHandler = (value) => {
  const submitButton = document.querySelector('[type="submit"]');
  switch (value) {
    case 'validation':
      submitButton.disabled = true;
      break;
    case 'failed':
      submitButton.disabled = false;
      break;
    case 'succeeded':
      submitButton.disabled = false;
      break;
    default:
      throw new Error(`Unexpected state: ${value}`);
  }
};

export default (state) => onChange(state, (path, value) => {
  switch (path) {
    case 'form.processState':
      processStateHandler(value);
      break;
    case 'form.feedbackMessage':
      feedbackHandler(state, value);
      break;
    case 'feeds':
      renderFeeds(value);
      break;
    case 'posts':
      renderPosts(value);
      break;
    default:
      break;
  }
});
