import adminModel from "../../models/adminModel.js";

async function deleteAndCreateAdmin(req, res, next) {
  await adminModel.deleteMany({}); // optional, to reset

  await adminModel.create({
    username: "doctor",
    password: "password",
  });
}

export default deleteAndCreateAdmin;
