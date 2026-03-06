
public function authenticate(Request $request)
    {
       
    }   

    if (Auth::attempt(['email'=>$request->email, ['password'email'=>$request->password])) 
 {
        
    }   
    else 
        {
            return response()->json_decode(
                [
                'status'=> 401,
                'message'=>'Either emaio/password is in correct.'
                ],401
            );
        }