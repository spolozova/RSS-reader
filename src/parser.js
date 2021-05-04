export default (data) => {
  const parser = new DOMParser();
  try {
    const rssDom = parser.parseFromString(data.contents, 'text/xml');
    const channel = rssDom.querySelector('channel');
    const title = channel.querySelector('title').textContent;
    const description = channel.querySelector('description').textContent;
    const postsData = rssDom.querySelectorAll('item');
    const posts = [];
    postsData.forEach((post) => {
      posts.push({
        link: post.querySelector('link').textContent,
        title: post.querySelector('title').textContent,
        description: post.querySelector('description').textContent,
      });
    });
    return { title, description, posts };
  } catch (e) {
    throw new Error('parserError');
  }
};
