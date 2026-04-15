import { 
  createUserWithEmailAndPassword 
} from "firebase/auth";

import { 
  doc, setDoc, updateDoc, arrayUnion, serverTimestamp 
} from "firebase/firestore";

async function signupUser(auth, db, {
  email,
  password,
  username,
  realName,
  role,          // "Kid", "FamilyMember", "Parent", "Creator", "Admin", "MainAdmin"
  familyId=null, // only for FamilyMember
  parentEmail=null // only for FamilyMember
}) {

  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // 2. Build base user object
  const userData = {
    uid: uid,
    email: email,
    username: username,
    realName: realName,
    role: role,
    familyId: familyId,
    isFamilyManager: role === "Parent",
    parentEmail: parentEmail,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    status: "active",
    warnings: 0,
    profileImage: null,
    settings: {
      allowChat: true,
      allowPublishing: false,
      allowFriends: true,
      allowProfileEditing: true,
      allowDesktopEditor: true,
      allowMultiplayer: true
    }
  };

  // 3. Create user document
  await setDoc(doc(db, "users", uid), userData);

  // 4. If parent → create family
  if (role === "Parent") {
    const newFamilyId = uid; // parent UID becomes familyId
    await setDoc(doc(db, "families", newFamilyId), {
      familyId: newFamilyId,
      managerUid: uid,
      managerEmail: email,
      kidUids: [],
      kidEmails: [],
      createdAt: serverTimestamp(),
      settings: {
        ccAllEmails: true,
        enforceChatRestrictions: true,
        allowPublishing: false,
        allowChat: true,
        allowFriends: true
      }
    });

    // update user with familyId
    await updateDoc(doc(db, "users", uid), {
      familyId: newFamilyId
    });
  }

  // 5. If FamilyMember → link to family
  if (role === "FamilyMember" && familyId) {
    await updateDoc(doc(db, "families", familyId), {
      kidUids: arrayUnion(uid),
      kidEmails: arrayUnion(email)
    });
  }

  return uid;
}