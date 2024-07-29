import Express from "express";
import { addNewOffer, deleteOffer, searchAllOffer, updateOffer } from "../controllers/offer.controllers";
import { adminOnly, authenticated } from "../middleware/auth.middleware";

const router = Express.Router();

router.get("/searchoffer",searchAllOffer);
router.post("/newoffer", authenticated,addNewOffer);
router.put("/updateoffer/:id",adminOnly,updateOffer);
router.delete("/deleteoffer/:id",adminOnly, deleteOffer);

export default router;
