// src/contexts/DataContext.jsx
import React, { createContext, useContext, useCallback, useReducer, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth }              from "./AuthContext";
import { equipmentService }    from "../services/equipmentService";
import { jobService }          from "../services/jobService";
import { driverService }       from "../services/driverService";
import { maintenanceService }  from "../services/maintenanceService";
import { settingsService }     from "../services/settingsService";
import { paymentService }      from "../services/paymentService";
import { driverCostService }   from "../services/driverCostService";
import { salaryService }       from "../services/salaryService";
import { attendanceService }   from "../services/attendanceService";
import { DEFAULT_FUEL_PRICE }  from "../config/constants";

const initialState = {
  equipment:     [],
  jobs:          [],
  drivers:       [],
  maintenance:   [],
  payments:      [],
  driverCosts:   [],
  salaryEntries: [],
  attendance:    [],
  settings:      { fuelPrice: DEFAULT_FUEL_PRICE },
  loading:       true,
  error:         null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_ALL":     return { ...state, ...action.payload, loading: false };
    case "SET_LOADING": return { ...state, loading: action.payload };
    case "SET_ERROR":   return { ...state, error: action.payload, loading: false };

    case "ADD_EQUIPMENT":    return { ...state, equipment: [action.payload, ...state.equipment] };
    case "UPDATE_EQUIPMENT": return { ...state, equipment: state.equipment.map(e => e.id === action.payload.id ? action.payload : e) };
    case "DELETE_EQUIPMENT": return { ...state, equipment: state.equipment.filter(e => e.id !== action.payload) };

    case "ADD_JOB":    return { ...state, jobs: [action.payload, ...state.jobs] };
    case "UPDATE_JOB": return { ...state, jobs: state.jobs.map(j => j.id === action.payload.id ? action.payload : j) };
    case "DELETE_JOB": return { ...state, jobs: state.jobs.filter(j => j.id !== action.payload) };

    case "ADD_DRIVER":    return { ...state, drivers: [action.payload, ...state.drivers] };
    case "UPDATE_DRIVER": return { ...state, drivers: state.drivers.map(d => d.id === action.payload.id ? action.payload : d) };
    case "DELETE_DRIVER": return { ...state, drivers: state.drivers.filter(d => d.id !== action.payload) };

    case "ADD_MAINTENANCE":    return { ...state, maintenance: [action.payload, ...state.maintenance] };
    case "UPDATE_MAINTENANCE": return { ...state, maintenance: state.maintenance.map(m => m.id === action.payload.id ? action.payload : m) };
    case "DELETE_MAINTENANCE": return { ...state, maintenance: state.maintenance.filter(m => m.id !== action.payload) };

    case "ADD_PAYMENT":    return { ...state, payments: [action.payload, ...state.payments] };
    case "UPDATE_PAYMENT": return { ...state, payments: state.payments.map(p => p.id === action.payload.id ? action.payload : p) };
    case "DELETE_PAYMENT": return { ...state, payments: state.payments.filter(p => p.id !== action.payload) };

    case "ADD_DRIVER_COST":    return { ...state, driverCosts: [action.payload, ...state.driverCosts] };
    case "UPDATE_DRIVER_COST": return { ...state, driverCosts: state.driverCosts.map(c => c.id === action.payload.id ? action.payload : c) };
    case "DELETE_DRIVER_COST": return { ...state, driverCosts: state.driverCosts.filter(c => c.id !== action.payload) };

    case "ADD_SALARY":    return { ...state, salaryEntries: [action.payload, ...state.salaryEntries] };
    case "UPDATE_SALARY": return { ...state, salaryEntries: state.salaryEntries.map(s => s.id === action.payload.id ? action.payload : s) };
    case "DELETE_SALARY": return { ...state, salaryEntries: state.salaryEntries.filter(s => s.id !== action.payload) };

    case "ADD_ATTENDANCE":    return { ...state, attendance: [action.payload, ...state.attendance] };
    case "UPDATE_ATTENDANCE": return { ...state, attendance: state.attendance.map(a => a.id === action.payload.id ? action.payload : a) };
    case "DELETE_ATTENDANCE": return { ...state, attendance: state.attendance.filter(a => a.id !== action.payload) };

    case "UPDATE_SETTINGS": return { ...state, settings: { ...state.settings, ...action.payload } };
    default: return state;
  }
};

const safeFetch = (promise) => promise.catch(() => []);
const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const [equipment, jobs, drivers, maintenance, settings] = await Promise.all([
          equipmentService.getAll(user.uid),
          jobService.getAll(user.uid),
          driverService.getAll(user.uid),
          maintenanceService.getAll(user.uid),
          settingsService.get(user.uid),
        ]);
        const [payments, driverCosts, salaryEntries, attendance] = await Promise.all([
          safeFetch(paymentService.getAll(user.uid)),
          safeFetch(driverCostService.getAll(user.uid)),
          safeFetch(salaryService.getAll(user.uid)),
          safeFetch(attendanceService.getAll(user.uid)),
        ]);
        dispatch({ type: "SET_ALL", payload: { equipment, jobs, drivers, maintenance, settings, payments, driverCosts, salaryEntries, attendance } });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: err.message });
        toast.error("خطأ في تحميل البيانات");
      }
    })();
  }, [user]);

  const addEquipment    = useCallback(async (d) => { const id = await equipmentService.add(user.uid, d);   dispatch({ type:"ADD_EQUIPMENT",    payload:{id,...d} }); toast.success("تم إضافة المعدة");       }, [user]);
  const updateEquipment = useCallback(async (id,d) => { await equipmentService.update(id,d);               dispatch({ type:"UPDATE_EQUIPMENT", payload:{id,...d} }); toast.success("تم تحديث المعدة");       }, []);
  const deleteEquipment = useCallback(async (id) => { await equipmentService.remove(id);                   dispatch({ type:"DELETE_EQUIPMENT", payload:id });        toast.success("تم حذف المعدة");         }, []);

  const addJob    = useCallback(async (d) => { const id = await jobService.add(user.uid, d);               dispatch({ type:"ADD_JOB",    payload:{id,...d} }); toast.success("تم تسجيل العملية");     }, [user]);
  const updateJob = useCallback(async (id,d) => { await jobService.update(id,d);                           dispatch({ type:"UPDATE_JOB", payload:{id,...d} }); toast.success("تم تحديث العملية");     }, []);
  const deleteJob = useCallback(async (id) => { await jobService.remove(id);                               dispatch({ type:"DELETE_JOB", payload:id });        toast.success("تم حذف العملية");       }, []);

  const addDriver    = useCallback(async (d) => { const id = await driverService.add(user.uid, d);         dispatch({ type:"ADD_DRIVER",    payload:{id,...d} }); toast.success("تم إضافة السائق");      }, [user]);
  const updateDriver = useCallback(async (id,d) => { await driverService.update(id,d);                     dispatch({ type:"UPDATE_DRIVER", payload:{id,...d} }); toast.success("تم تحديث السائق");      }, []);
  const deleteDriver = useCallback(async (id) => { await driverService.remove(id);                         dispatch({ type:"DELETE_DRIVER", payload:id });        toast.success("تم حذف السائق");        }, []);

  const addMaintenance    = useCallback(async (d) => { const id = await maintenanceService.add(user.uid, d); dispatch({ type:"ADD_MAINTENANCE",    payload:{id,...d} }); toast.success("تم تسجيل الصيانة");  }, [user]);
  const updateMaintenance = useCallback(async (id,d) => { await maintenanceService.update(id,d);             dispatch({ type:"UPDATE_MAINTENANCE", payload:{id,...d} }); toast.success("تم تحديث الصيانة");  }, []);
  const deleteMaintenance = useCallback(async (id) => { await maintenanceService.remove(id);                 dispatch({ type:"DELETE_MAINTENANCE", payload:id });        toast.success("تم حذف الصيانة");    }, []);

  const addPayment    = useCallback(async (d) => { const id = await paymentService.add(user.uid, d);       dispatch({ type:"ADD_PAYMENT",    payload:{id,...d} }); toast.success("تم تسجيل الدفعة");     }, [user]);
  const updatePayment = useCallback(async (id,d) => { await paymentService.update(id,d);                   dispatch({ type:"UPDATE_PAYMENT", payload:{id,...d} }); toast.success("تم تحديث الدفعة");     }, []);
  const deletePayment = useCallback(async (id) => { await paymentService.remove(id);                       dispatch({ type:"DELETE_PAYMENT", payload:id });        toast.success("تم حذف الدفعة");       }, []);

  const addDriverCost    = useCallback(async (d) => { const id = await driverCostService.add(user.uid, d); dispatch({ type:"ADD_DRIVER_COST",    payload:{id,...d} }); toast.success("تم تسجيل التكلفة");  }, [user]);
  const updateDriverCost = useCallback(async (id,d) => { await driverCostService.update(id,d);             dispatch({ type:"UPDATE_DRIVER_COST", payload:{id,...d} }); toast.success("تم تحديث التكلفة");  }, []);
  const deleteDriverCost = useCallback(async (id) => { await driverCostService.remove(id);                 dispatch({ type:"DELETE_DRIVER_COST", payload:id });        toast.success("تم حذف التكلفة");    }, []);

  const addSalaryEntry    = useCallback(async (d) => { const id = await salaryService.add(user.uid, d);    dispatch({ type:"ADD_SALARY",    payload:{id,...d} }); toast.success("تم التسجيل");           }, [user]);
  const updateSalaryEntry = useCallback(async (id,d) => { await salaryService.update(id,d);                dispatch({ type:"UPDATE_SALARY", payload:{id,...d} }); toast.success("تم التحديث");           }, []);
  const deleteSalaryEntry = useCallback(async (id) => { await salaryService.remove(id);                    dispatch({ type:"DELETE_SALARY", payload:id });        toast.success("تم الحذف");             }, []);

  const addAttendance    = useCallback(async (d) => { const id = await attendanceService.add(user.uid, d); dispatch({ type:"ADD_ATTENDANCE",    payload:{id,...d} }); toast.success("تم تسجيل الحضور");   }, [user]);
  const updateAttendance = useCallback(async (id,d) => { await attendanceService.update(id,d);             dispatch({ type:"UPDATE_ATTENDANCE", payload:{id,...d} }); toast.success("تم تحديث الحضور");   }, []);
  const deleteAttendance = useCallback(async (id) => { await attendanceService.remove(id);                 dispatch({ type:"DELETE_ATTENDANCE", payload:id });        toast.success("تم حذف السجل");      }, []);

  const saveSettings = useCallback(async (d) => {
    await settingsService.save(user.uid, d);
    dispatch({ type:"UPDATE_SETTINGS", payload:d });
    toast.success("تم حفظ الإعدادات");
  }, [user]);

  const value = {
    ...state,
    addEquipment, updateEquipment, deleteEquipment,
    addJob, updateJob, deleteJob,
    addDriver, updateDriver, deleteDriver,
    addMaintenance, updateMaintenance, deleteMaintenance,
    addPayment, updatePayment, deletePayment,
    addDriverCost, updateDriverCost, deleteDriverCost,
    addSalaryEntry, updateSalaryEntry, deleteSalaryEntry,
    addAttendance, updateAttendance, deleteAttendance,
    saveSettings,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
};
