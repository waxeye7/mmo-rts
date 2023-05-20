export default async (_to, _from, next) => {
  const response = await fetch(process.env.VUE_APP_API_URL + `/users/me`, {
    credentials: 'include'
  });

  if (response.ok) {
    next("/");
  } else {
    next();
  }
};