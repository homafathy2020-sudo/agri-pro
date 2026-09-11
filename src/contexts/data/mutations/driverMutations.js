// src/contexts/data/mutations/driverMutations.js
//
// عمليات السائقين — منقولة هنا حرفيًا من DataContext.jsx من غير أي تغيير
// في السلوك.
import { useCallback } from "react";
import toast from "react-hot-toast";
import { driverService } from "../../../services/driverService";

export function useDriverMutations({ user, dispatch, stateRef, trackWrite }) {
  const addDriver = useCallback(async (d) => {
    const { id, promise } = driverService.add(user.uid, d);
    dispatch({ type: "ADD_DRIVER", payload: { id, ...d } });
    trackWrite(promise, {
      rollback: () => dispatch({ type: "DELETE_DRIVER", payload: id }),
      errorMessage: "تعذر حفظ السائق، تم التراجع عن الإضافة",
    });
    toast.success("تم إضافة السائق");
    return id;
  }, [user, dispatch, trackWrite]);

  const updateDriver = useCallback(async (id, d) => {
    const previous = stateRef.current.drivers.find((x) => x.id === id);
    dispatch({ type: "UPDATE_DRIVER", payload: { id, ...d } });
    trackWrite(driverService.update(user.uid, id, d), {
      rollback: () => previous && dispatch({ type: "UPDATE_DRIVER", payload: previous }),
      errorMessage: "تعذر حفظ تعديل السائق، تم التراجع عن التعديل",
    });
    toast.success("تم تحديث السائق");
  }, [user, dispatch, stateRef, trackWrite]);

  const deleteDriver = useCallback(async (id) => {
    const previous = stateRef.current.drivers.find((x) => x.id === id);
    dispatch({ type: "DELETE_DRIVER", payload: id });
    trackWrite(driverService.remove(user.uid, id), {
      rollback: () => previous && dispatch({ type: "ADD_DRIVER", payload: previous }),
      errorMessage: "تعذر حذف السائق، تم استرجاعه",
    });
    toast.success("تم حذف السائق");
  }, [user, dispatch, stateRef, trackWrite]);

  return { addDriver, updateDriver, deleteDriver };
}
