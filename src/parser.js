export default (data) => {
  const parser = new DOMParser();
  const rssDom = parser.parseFromString(data.contents, 'text/xml');
  if (rssDom.querySelector('parsererror')) {
    const error = new Error();
    error.code = 'parserError';
    throw error;
  } else {
    const channel = rssDom.querySelector('channel');
    const titleElement = channel.querySelector('title');
    const descriptionElemrnt = channel.querySelector('description');
    const feedTitle = titleElement.textContent;
    const feedDescription = descriptionElemrnt.textContent;
    const postsData = rssDom.querySelectorAll('item');
    const posts = [];
    postsData.forEach((post) => {
      const postLink = post.querySelector('link');
      const postTitle = post.querySelector('title');
      const postDescription = post.querySelector('description');
      const postGuid = post.querySelector('guid');
      posts.push({
        link: postLink.textContent,
        title: postTitle.textContent,
        description: postDescription.textContent,
        guid: postGuid.textContent,
      });
    });
    return {
      title: feedTitle,
      description: feedDescription,
      posts,
    };
  }
};
