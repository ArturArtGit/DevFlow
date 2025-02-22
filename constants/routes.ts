const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  ASK_QUESTION: "/ask-question",
  PROFILE: (id: string | number) => `/profile/${id}`,
  QUESTION: (id: string | number) => `/questions/${id}`,
  TAGS: (id: string | number) => `/tags/${id}`,
}

export default ROUTES
