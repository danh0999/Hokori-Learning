import "./App.css";
import { Provider } from "react-redux";  
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes/Route.jsx";
import { persistor, store } from "./redux/store.js";
import { PersistGate } from "redux-persist/integration/react";
function App() {
  const router = createBrowserRouter(routes);
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  );
}

export default App;
