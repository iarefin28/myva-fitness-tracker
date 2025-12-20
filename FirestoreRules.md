rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isRequestIdValid(requestId, fromUid, toUid) {
      return requestId == fromUid + "_" + toUid;
    }

    function isAddingSelfToFriends(uid) {
      return isSignedIn()
        && request.auth.uid != uid
        && request.resource.data.diff(resource.data).changedKeys().hasOnly(["friends"])
        && request.resource.data.friends.size() == resource.data.friends.size() + 1
        && request.resource.data.friends.hasAll(resource.data.friends)
        && request.auth.uid in request.resource.data.friends;
    }

    // ——————————————————————————
    // USER PROFILES (Social Layer)
    // ——————————————————————————
    match /users/{uid} {

      // ANY logged-in user can read user profiles
      allow read: if isSignedIn();

      // ONLY the owner can modify their own user document
      allow create: if isSignedIn() && request.auth.uid == uid;
      allow update, delete: if isSignedIn() && request.auth.uid == uid;

      // Allow a non-owner to add themselves as a friend (accept flow).
      allow update: if isAddingSelfToFriends(uid);
    }

    // ——————————————————————————
    // FRIEND REQUESTS (Per-user subcollections)
    // ——————————————————————————
    match /users/{uid}/incomingRequests/{requestId} {
      allow read: if isSignedIn() && request.auth.uid == uid;

      // Sender creates incoming request under receiver.
      allow create: if isSignedIn()
        && request.auth.uid == request.resource.data.fromUid
        && request.resource.data.toUid == uid
        && request.resource.data.status == "pending"
        && isRequestIdValid(requestId, request.resource.data.fromUid, request.resource.data.toUid);

      // Receiver can accept/reject; sender can cancel.
      allow update: if isSignedIn()
        && (request.auth.uid == uid || request.auth.uid == resource.data.fromUid)
        && request.resource.data.fromUid == resource.data.fromUid
        && request.resource.data.toUid == resource.data.toUid
        && request.resource.data.status in ["pending", "accepted", "rejected", "canceled"]
        && isRequestIdValid(requestId, resource.data.fromUid, resource.data.toUid);
    }

    match /users/{uid}/outgoingRequests/{requestId} {
      allow read: if isSignedIn() && request.auth.uid == uid;

      // Sender creates outgoing request under themselves.
      allow create: if isSignedIn()
        && request.auth.uid == uid
        && request.resource.data.fromUid == uid
        && request.resource.data.status == "pending"
        && isRequestIdValid(requestId, request.resource.data.fromUid, request.resource.data.toUid);

      // Sender can cancel; receiver can accept.
      allow update: if isSignedIn()
        && (request.auth.uid == uid || request.auth.uid == resource.data.toUid)
        && request.resource.data.fromUid == resource.data.fromUid
        && request.resource.data.toUid == resource.data.toUid
        && request.resource.data.status in ["pending", "accepted", "rejected", "canceled"]
        && isRequestIdValid(requestId, resource.data.fromUid, resource.data.toUid);
    }

    // ——————————————————————————
    // USER EXERCISES
    // ——————————————————————————
    match /users/{uid}/exercises/{exerciseId} {

      // Only the owner can read / write exercises
      allow read, write: if isSignedIn() && request.auth.uid == uid;

      // enforce constraints on new exercise creation
      allow create: if request.resource.data.nameLower == lower(request.resource.data.name)
                    && request.resource.data.type in ['weighted','bodyweight','timed','distance'];
    }
  }
}
