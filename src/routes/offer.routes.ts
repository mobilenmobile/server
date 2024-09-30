import Express from "express";
import { addNewOffer, deleteOffer, searchAllOffer, updateOffer } from "../controllers/offer.controllers";
import { adminOnly, authenticated } from "../middleware/auth.middleware";

const router = Express.Router();

router.get("/", searchAllOffer);
router.post("/", addNewOffer);
router.put("/updateoffer/:id", adminOnly, updateOffer);
router.delete("/:offerId", deleteOffer);

export default router;
