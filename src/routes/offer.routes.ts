import Express from "express";
import { addNewOffer, deleteOffer, searchAllOffer, updateOffer } from "../controllers/offer.controllers";
import { authenticated } from "../middleware/auth.middleware";

const router = Express.Router();

router.get("/searchoffer",searchAllOffer);
router.post("/newoffer", authenticated,addNewOffer);
router.put("/updateoffer/:id",authenticated,updateOffer);
router.delete("/deleteoffer/:id",authenticated, deleteOffer);

export default router;
