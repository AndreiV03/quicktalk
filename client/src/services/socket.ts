import { io } from "socket.io-client";

const socket = io(process.env.NODE_ENV === "development" ? "http://localhost:5000" : "https://quicktalk-andreiv03.herokuapp.com");
export default socket;