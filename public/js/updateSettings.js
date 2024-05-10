import axios from 'axios';
import { showAlert } from './alerts';

// type is 'password or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url = 
    type === 'password' 
    ? 'http://localhost:3000/api/v1/users/updateMyPassword' 
    : 'http://localhost:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    // console.log('this is response from updateSettings:', res)

    if(res.data.status === 'success'){
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (error) {
    // console.log(error.response.data)
    showAlert('error', error.response.data.message);
  }

}