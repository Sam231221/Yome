# Introduction

An Saas Education website to centralize education system.
signIn(provider, { redirect: false })
.then((callback) => {
if (callback?.error) {
toast.error("Invalid credentials!");
}

        if (callback?.ok) {
          router.push("/");
        }
      })
      .finally(() => setIsLoading(false));
