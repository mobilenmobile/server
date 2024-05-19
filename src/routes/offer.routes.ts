import Express from "express";
import { addNewOffer, searchAllOffer } from "../controllers/offer.controllers";

const router = Express.Router();

router.get("/searchoffer", searchAllOffer);
router.post("/newoffer", addNewOffer);

export default router;
