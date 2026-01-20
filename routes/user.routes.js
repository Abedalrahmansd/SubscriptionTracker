import { Router } from "express";
import { getUsers, getUser } from "../controllers/user.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.get('/', authorize, getUsers);

userRouter.get('/:id', authorize, getUser);

userRouter.post('/', authorize, (req, res) => res.send({'Title':'Create new user'}));

userRouter.put('/:id', authorize, (req, res) => res.send({'Title':'Update user by ID'}));
userRouter.delete('/:id', authorize, (req, res) => res.send({'Title':'Delete user by ID'}));

export default userRouter;